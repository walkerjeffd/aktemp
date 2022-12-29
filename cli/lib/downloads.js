const debug = require('../debug')
// const path = require('path')
// const os = require('os')
// const { mkdtemp } = require('fs/promises')
const stream = require('stream')
const JSZip = require('jszip')
const { Download, Station } = require('aktemp-db/models')
const {
  writeStationsFile,
  writeSeriesDailyFile,
  writeSeriesDiscreteFile,
  writeProfilesFile
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

  const zip = new JSZip()

  let download = await Download.query()
    .findById(id)
    .throwIfNotFound({
      message: `download (id=${id}) not found`,
      type: 'NotFoundError'
    })
  debug(`processDownload(): proccessing (uuid=${download.uuid})`)

  await download.$query().patch({
    status: 'PROCESSING',
    error: null
  })

  debug('processDownload(): fetching stations')
  const config = download.config
  const stationIds = config.stationIds || []
  const stations = await Station.query()
    .findByIds(stationIds)
    .modify('organizationCode')
    .modify('seriesSummary')
    .modify('profilesSummary')
  if (stations.length === 0) {
    throw new Error('No stations found in download request')
  }
  stations.forEach(d => {
    d.series_count_days = countDays(d.series_start_datetime, d.series_end_datetime, d.timezone)
  })

  debug(`processDownload(): create stations file (n=${stations.length})`)
  const stationsFile = await writeStationsFile(stations)

  debug('processDownload(): adding stations.csv to zip file')
  zip.file('stations.csv', stationsFile)

  if (config.types.daily) {
    debug('processDownload(): getting daily series')
    const series = await Station.relatedQuery('series')
      .for(stations)
      .where('interval', 'CONTINUOUS')
      .modify('stationOrganization')
      .withGraphFetched('[daily, flags]')
    series.forEach(d => {
      d.daily.forEach(v => {
        v.date = luxon.DateTime.fromISO(v.date, { zone: d.station_timezone }).toJSDate()
      })
      d.daily = {
        values: assignFlags(d.daily, d.flags, d.station_timezone, true)
      }
    })

    debug(`processDownload(): create continuous series file (n=${series.length})`)
    const body = await writeSeriesDailyFile(series)

    debug('processDownload(): adding daily-timeseries.csv to zip file')
    zip.file('daily-timeseries.csv', body)
  }

  if (config.types.discrete) {
    debug('processDownload(): getting discrete series')
    const series = await Station.relatedQuery('series')
      .for(stations)
      .where('interval', 'DISCRETE')
      .modify('stationOrganization')
      .withGraphFetched('[values, flags]')
    series.forEach(d => {
      d.values.forEach(v => {
        v.station_timezone = d.station_timezone
      })
      d.values = assignFlags(d.values, d.flags)
    })

    debug(`processDownload(): create discrete series file (n=${series.length})`)
    const body = await writeSeriesDiscreteFile(series)

    debug('processDownload(): adding discrete-timeseries.csv to zip file')
    zip.file('discrete-timeseries.csv', body)
  }

  if (config.types.profiles) {
    debug('processDownload(): getting profiles series')
    const profiles = await Station.relatedQuery('profiles')
      .for(stations)
      .modify('stationOrganization')
      .withGraphFetched('values')
    profiles.forEach(d => {
      d.values.forEach(v => {
        v.station_timezone = d.station_timezone
      })
    })

    debug(`processDownload(): create profiles series file (n=${profiles.length})`)
    const body = await writeProfilesFile(profiles)

    debug('processDownload(): adding profiles.csv to zip file')
    zip.file('profiles.csv', body)
  }

  const timestamp = formatTimestamp(luxon.DateTime.fromJSDate(new Date(download.created_at)), 'yyyyMMdd_HHmm', 'US/Alaska')
  const key = `downloads/${download.uuid}/AKTEMP-download-${timestamp}.zip`

  debug(`processDownload(): set up s3 stream (key=${key})`)
  const { pass: s3Stream, promise: s3Promise } = uploadZipFromStream(key)

  debug('processDownload(): upload stream to s3')
  zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
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
  // debug(download)

  debug('processDownload(): done')
  return download
}
