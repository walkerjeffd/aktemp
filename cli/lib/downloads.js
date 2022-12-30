const debug = require('../debug')
const stream = require('stream')
const path = require('path')
const os = require('os')
const fs = require('fs')
const { zip } = require('zip-a-folder')
const { Download, Station, Organization } = require('aktemp-db/models')
const {
  writeStationsFile,
  writeSeriesRawFile,
  writeSeriesDailyFile,
  writeSeriesDiscreteFile,
  writeProfilesFile,
  writeSeriesMetadataFile
} = require('aktemp-utils/downloads')
const { assignFlags } = require('aktemp-utils/flags')
const { luxon, formatTimestamp, countDays } = require('aktemp-utils/time')
const { s3, s3GetFilesize } = require('../aws')

const BUCKET = process.env.STORAGE_BUCKET

function uploadZipFromStream (key) {
  const pass = new stream.PassThrough()

  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: pass,
    ContentType: 'application/zip'
  }
  const promise = s3.upload(params).promise()

  return {
    pass, promise
  }
}

exports.processDownload = async (id, { dryRun }) => {
  debug(`processDownload(): id=${id}, dryRun=${dryRun}`)

  let download = await Download.query()
    .findById(id)
    .throwIfNotFound({
      message: `download (id=${id}) not found`,
      type: 'NotFoundError'
    })
  debug(`processDownload(): proccessing (uuid=${download.uuid})`)

  const dir = path.join(os.tmpdir(), download.uuid)
  debug(`processDownload(): dir=${dir}`)
  if (fs.existsSync(dir)) {
    debug('processDownload(): deleting existing directory')
    fs.rmSync(dir, { recursive: true, force: true })
  }
  debug('processDownload(): creating directory')
  fs.mkdirSync(dir)

  await download.$query().patch({
    status: 'PROCESSING',
    error: null
  })

  const config = download.config

  let organization
  let stations
  if (config.organizationId) {
    debug(`processDownload(): fetching organization (id=${config.organizationId})`)
    organization = await Organization.query()
      .findById(config.organizationId)
      .throwIfNotFound({
        message: `organization (id=${config.organizationId}) not found`,
        type: 'NotFoundError'
      })
    debug(`processDownload(): fetching stations for organization (${organization.code})`)
    stations = await organization
      .$relatedQuery('stations')
      .modify('organizationCode')
      .modify('seriesSummary')
      .modify('profilesSummary')
  } else if (config.stationIds) {
    debug(`processDownload(): fetching stations by id (n=${config.stationIds.length})`)
    stations = await Station.query()
      .findByIds(config.stationIds)
      .modify('organizationCode')
      .modify('seriesSummary')
      .modify('profilesSummary')
  }

  if (stations.length === 0) {
    throw new Error('No stations found in download request')
  }
  stations.forEach(d => {
    d.series_count_days = countDays(d.series_start_datetime, d.series_end_datetime, d.timezone)
  })

  debug(`processDownload(): create stations file (n=${stations.length})`)
  const stationsFile = await writeStationsFile(stations)

  debug('processDownload(): writing stations.csv')
  fs.writeFileSync(path.join(dir, 'stations.csv'), stationsFile)

  let key
  if (config.export) {
    console.log('export')
    key = `downloads/${download.uuid}/AKTEMP-export-${organization.code}.zip`
    for (const station of stations) {
      debug(`processDownload(): processing station (id=${station.id}, code=${station.code})`)

      debug(`processDownload(): create station folder (${path.join(dir, station.code)})`)
      fs.mkdirSync(path.join(dir, station.code))
      fs.mkdirSync(path.join(dir, station.code, 'timeseries'))

      debug(`processDownload(): fetching series (station_id=${station.id})`)
      const series = await station.$relatedQuery('series')
        .withGraphFetched('[flags]')
        .modify('stationOrganization')

      const seriesFilename = path.join(station.code, 'timeseries.csv')
      debug(`processDownload(): writing timeseries metadata file (${seriesFilename})`)
      const seriesMetadataBody = writeSeriesMetadataFile(series)
      fs.writeFileSync(path.join(dir, seriesFilename), seriesMetadataBody)

      for (const s of series) {
        debug(`processDownload(): fetching values (series_id=${s.id}, station_id=${station.id})`)
        const values = await s.$relatedQuery('values')
        values.forEach(d => {
          d.series_id = s.id
          d.station_timezone = s.station_timezone
        })
        s.values = assignFlags(values, s.flags)

        const seriesValuesFilename = path.join(station.code, 'timeseries', `timeseries-${s.id}.csv`)
        debug(`processDownload(): writing timeseries values file (${seriesValuesFilename})`)
        const seriesValuesBody = writeSeriesRawFile([s])
        fs.writeFileSync(path.join(dir, seriesValuesFilename), seriesValuesBody)
      }

      debug(`processDownload(): fetching profiles (station_id=${station.id})`)
      const profiles = await station.$relatedQuery('profiles')
        .modify('stationOrganization')
        .withGraphFetched('values')
      profiles.forEach(d => {
        d.values.forEach(v => {
          v.profile_id = d.id
          v.station_timezone = d.station_timezone
        })
      })

      const profilesFilename = `${station.code}/profiles.csv`
      debug(`processDownload(): writing profiles file (${profilesFilename})`)
      const profilesBody = writeProfilesFile(profiles)
      fs.writeFileSync(path.join(dir, profilesFilename), profilesBody)
    }
  } else {
    const timestamp = formatTimestamp(luxon.DateTime.fromJSDate(new Date(download.created_at)), 'yyyyMMdd_HHmm', 'US/Alaska')
    key = `downloads/${download.uuid}/AKTEMP-download-${timestamp}.zip`

    if (config.types.daily) {
      debug('processDownload(): getting daily series')
      let query = Station.relatedQuery('series')
        .for(stations)
        .where('interval', 'CONTINUOUS')
        .modify('stationOrganization')
        .withGraphFetched('[daily, flags]')

      if (config.period) {
        if (config.period.start) {
          query = query.whereRaw('(end_datetime at time zone station.timezone)::date >= ?', [config.period.start])
        }
        if (config.period.end) {
          query = query.whereRaw('(start_datetime at time zone station.timezone)::date <= ?', [config.period.end])
        }
      }

      const series = await query
      series.forEach(d => {
        if (config.period) {
          if (config.period.start) {
            d.daily = d.daily.filter(d => d.date >= config.period.start)
          }
          if (config.period.end) {
            d.daily = d.daily.filter(d => d.date <= config.period.end)
          }
        }
        d.daily.forEach(v => {
          v.date = luxon.DateTime.fromISO(v.date, { zone: d.station_timezone }).toJSDate()
        })
        d.daily = {
          values: assignFlags(d.daily, d.flags, d.station_timezone, true)
        }
      })

      debug(`processDownload(): create continuous series file (n=${series.length})`)
      const body = await writeSeriesDailyFile(series, config.period)

      debug('processDownload(): writing daily timeseries file (daily-timeseries.csv)')
      fs.writeFileSync(path.join(dir, 'daily-timeseries.csv'), body)
    }

    if (config.types.discrete) {
      debug('processDownload(): getting discrete series')
      let query = Station.relatedQuery('series')
        .for(stations)
        .where('interval', 'DISCRETE')
        .modify('stationOrganization')
        .withGraphFetched('[values, flags]')

      if (config.period) {
        if (config.period.start) {
          query = query.whereRaw('(end_datetime at time zone station.timezone)::date >= ?', [config.period.start])
        }
        if (config.period.end) {
          query = query.whereRaw('(start_datetime at time zone station.timezone)::date <= ?', [config.period.end])
        }
      }

      const series = await query
      series.forEach(d => {
        if (config.period) {
          if (config.period.start) {
            d.values = d.values
              .filter(d => luxon.DateTime.fromJSDate(d.datetime, { zone: d.station_timezone }).toFormat('yyyy-MM-dd') >= config.period.start)
          }
          if (config.period.end) {
            d.values = d.values
              .filter(d => luxon.DateTime.fromJSDate(d.datetime, { zone: d.station_timezone }).toFormat('yyyy-MM-dd') <= config.period.end)
          }
        }
        d.values.forEach(v => {
          v.station_timezone = d.station_timezone
        })
        d.values = assignFlags(d.values, d.flags)
      })

      debug(`processDownload(): create discrete series file (n=${series.length})`)
      const body = await writeSeriesDiscreteFile(series, config.period)

      debug('processDownload(): writing discrete timeseries file (discrete-timeseries.csv)')
      fs.writeFileSync(path.join(dir, 'discrete-timeseries.csv'), body)
    }

    if (config.types.profiles) {
      debug('processDownload(): getting profiles series')
      let query = Station.relatedQuery('profiles')
        .for(stations)
        .modify('stationOrganization')
        .withGraphFetched('values')

      if (config.period) {
        if (config.period.start) {
          query = query.whereRaw('date >= ?', [config.period.start])
        }
        if (config.period.end) {
          query = query.whereRaw('date <= ?', [config.period.end])
        }
      }

      const profiles = await query
      profiles.forEach(d => {
        d.values.forEach(v => {
          v.station_timezone = d.station_timezone
        })
      })

      debug(`processDownload(): create profiles series file (n=${profiles.length})`)
      const body = await writeProfilesFile(profiles, config.period)

      debug('processDownload(): writing profiles file (profiles.csv)')
      fs.writeFileSync(path.join(dir, 'profiles.csv'), body)
    }
  }

  // create zip file
  const zipFilename = path.join(os.tmpdir(), `${download.uuid}.zip`)
  debug(`processDownload(): creating zip file (${zipFilename})`)
  await zip(dir, zipFilename)

  debug(`processDownload(): set up s3 stream (key=${key})`)
  const { pass: s3Stream, promise: s3Promise } = uploadZipFromStream(key)

  debug('processDownload(): uploading to s3')
  fs.createReadStream(zipFilename)
    .pipe(s3Stream)

  const s3Response = await s3Promise
  debug('processDownload(): s3 response ->')
  debug(s3Response)

  // get file size
  const fileSize = await s3GetFilesize(BUCKET, key)

  download = await download.$query().patch({
    s3: {
      Bucket: BUCKET,
      Key: key
    },
    size: fileSize,
    url: s3Response.Location,
    status: 'DONE'
  }).returning('*')

  debug('processDownload(): done')
  return download
}
