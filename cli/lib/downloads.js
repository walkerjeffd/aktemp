const debug = require('../debug')
// const path = require('path')
// const os = require('os')
// const { mkdtemp } = require('fs/promises')
const stream = require('stream')
const JSZip = require('jszip')
const { Download, Station } = require('aktemp-db/models')
const {
  writeFileHeader,
  writeStationsTable,
  writeSeriesTable,
  writeSeriesDailyValuesTable,
  writeSeriesRawValuesTable,
  writeProfilesTable,
  writeProfileValuesTable
} = require('aktemp-utils/downloads')
const { assignFlags } = require('aktemp-utils/flags')
const { luxon, formatTimestamp } = require('aktemp-utils/time')
const { s3, s3GetFilesize, sendDownloadEmail } = require('../aws')

const BUCKET = process.env.STORAGE_BUCKET

async function createStationsFile (stations) {
  debug(`createStationsFile(): n(stations)=${stations.length}`)
  const fileHeader = writeFileHeader()
  if (!stations || stations.length === 0) {
    return `${fileHeader}
# File contents: Stations metadata
#
# Selected station(s) not found
#
`
  }
  const stationsTable = writeStationsTable(stations)

  const body = `${fileHeader}
# File contents: Stations metadata
#
${stationsTable}
  `
  return body
}

async function createContinousSeriesDailyFile (series) {
  debug(`createContinousSeriesDailyFile(): n(series)=${series.length}`)
  const fileHeader = writeFileHeader()
  if (!series || series.length === 0) {
    return `${fileHeader}
# File contents: Continuous timeseries of observed water temperatures at daily intervals
#
# No continuous timeseries found for selected station(s)
#
`
  }
  const seriesTable = writeSeriesTable(series)
  const values = series.map(d => d.values.map(v => ({ series_id: d.id, ...v }))).flat()
  const valuesTable = writeSeriesDailyValuesTable(values)
  return `${fileHeader}
# File contents: Continuous timeseries of observed water temperatures at daily intervals
#
${seriesTable}
#
${valuesTable}
`
}

// async function createContinousSeriesRawFile (series) {
//   debug(`createContinousSeriesRawFile(): n(series)=${series.length}`)
//   const fileHeader = writeFileHeader()
//   const seriesTable = writeSeriesTable(series)
//   const values = series.map(d => d.values.map(v => ({ series_id: d.id, ...v }))).flat()
//   const valuesTable = writeSeriesRawValuesTable(values)

//   return `${fileHeader}
// #
// # Description: This file contains continuous timeseries of raw observed water temperatures
// #
// ${seriesTable}
// #
// ${valuesTable}
// `
// }

async function createDiscreteSeriesFile (series) {
  debug(`createDiscreteSeriesFile(): n(series)=${series.length}`)
  const fileHeader = writeFileHeader()
  if (!series || series.length === 0) {
    return `${fileHeader}
# File contents: Discrete timeseries of observed water temperatures
#
# No discrete timeseries found for selected station(s)
#
`
  }
  const seriesTable = writeSeriesTable(series)
  const values = series.map(d => d.values.map(v => ({
    series_id: d.id,
    station_timezone: d.station_timezone,
    ...v
  }))).flat()
  const valuesTable = writeSeriesRawValuesTable(values)

  return `${fileHeader}
# File contents: Discrete timeseries of observed water temperatures
#
${seriesTable}
#
${valuesTable}
`
}

async function createProfilesFile (profiles) {
  debug(`createProfilesFile(): n(profiles)=${profiles.length}`)
  const fileHeader = writeFileHeader()
  if (!profiles || profiles.length === 0) {
    return `${fileHeader}
# File contents: Vertical profiles of observed water temperatures
#
# No profiles found for selected station(s)
#
`
  }
  const profilesTable = writeProfilesTable(profiles)
  const values = profiles.map(d => d.values.map(v => ({
    profile_id: d.id,
    station_timezone: d.station_timezone,
    ...v
  }))).flat()
  const valuesTable = writeProfileValuesTable(values)

  return `${fileHeader}
# File contents: Vertical profiles of observed water temperatures
#
${profilesTable}
#
${valuesTable}
`
}

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

  debug(`processDownload(): create stations file (n=${stations.length})`)
  const stationsFile = await createStationsFile(stations)

  debug('processDownload(): adding stations.csv to zip file')
  zip.file('stations.csv', stationsFile)

  if (config.types.continuous) {
    debug('processDownload(): getting continuous series')
    const continuousSeries = await Station.relatedQuery('series')
      .for(stations)
      .where('interval', 'CONTINUOUS')
      .modify('stationOrganization')
      .withGraphFetched('[values(daily), flags]')
    continuousSeries.forEach(d => {
      d.values.forEach(v => {
        v.date = luxon.DateTime
          .fromISO(v.date, { zone: d.station_timezone })
      })
      d.flags.forEach(f => {
        f.start_datetime = luxon.DateTime
          .fromISO(f.start_datetime, { zone: d.station_timezone })
        f.end_datetime = luxon.DateTime
          .fromISO(f.end_datetime, { zone: d.station_timezone })
      })
      d.values = assignFlags(d.values, d.flags, true)
    })

    debug(`processDownload(): create continuous series file (n=${continuousSeries.length})`)
    const continuousSeriesFile = await createContinousSeriesDailyFile(continuousSeries)

    debug('processDownload(): adding daily-timeseries.csv to zip file')
    zip.file('daily-timeseries.csv', continuousSeriesFile)
  }

  if (config.types.discrete) {
    debug('processDownload(): getting discrete series')
    const discreteSeries = await Station.relatedQuery('series')
      .for(stations)
      .where('interval', 'DISCRETE')
      .modify('stationOrganization')
      .withGraphFetched('[values, flags]')
    discreteSeries.forEach(d => {
      d.values.forEach(v => {
        v.datetime = luxon.DateTime
          .fromJSDate(v.datetime, { zone: d.station_timezone })
      })
      d.flags.forEach(f => {
        f.start_datetime = luxon.DateTime
          .fromJSDate(f.start_datetime, { zone: d.station_timezone })
        f.end_datetime = luxon.DateTime
          .fromJSDate(f.end_datetime, { zone: d.station_timezone })
      })
      d.values = assignFlags(d.values, d.flags)
    })

    debug(`processDownload(): create discrete series file (n=${discreteSeries.length})`)
    const discreteSeriesFile = await createDiscreteSeriesFile(discreteSeries)

    debug('processDownload(): adding discrete-timeseries.csv to zip file')
    zip.file('discrete-timeseries.csv', discreteSeriesFile)
  }

  if (config.types.profiles) {
    debug('processDownload(): getting profiles series')
    const profiles = await Station.relatedQuery('profiles')
      .for(stations)
      .modify('stationOrganization')
      .withGraphFetched('values')
    profiles.forEach(d => {
      d.values.forEach(v => {
        v.datetime = luxon.DateTime
          .fromJSDate(v.datetime, { zone: d.station_timezone })
      })
    })

    debug(`processDownload(): create profiles series file (n=${profiles.length})`)
    const profilesFile = await createProfilesFile(profiles)

    debug('processDownload(): adding profiles.csv to zip file')
    zip.file('profiles.csv', profilesFile)
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
  debug(download)

  if (!dryRun) {
    debug('processDownload(): sending email')
    const emailResponse = await sendDownloadEmail(download)
    debug(emailResponse)
  }

  debug('processDownload(): done')
  return download
}
