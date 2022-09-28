const AWS = require('aws-sdk')
const Papa = require('papaparse')
const stripBom = require('strip-bom')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone.js')
const utc = require('dayjs/plugin/utc.js')

const { validateFileConfig } = require('./validators.js')
const { parseTimestamp, parseValue, parseDepth, extractTimestamp } = require('./parsers.js')
const { convertDepthUnits, medianFrequency } = require('./utils.js')
const { File } = require('../db/models/index.js')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.tz.setDefault('UTC')

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.REGION
})

async function readFile (file, config) {
  const { Bucket, Key } = file.s3
  const object = await s3.getObject({ Bucket, Key }).promise()
  let csv = stripBom(object.Body.toString())
  const { skipLines } = config.file

  if (skipLines > 0) {
    // if skipLines > 0, then
    //   1. parse file without headers
    //   2. remove first `skipLines` lines
    //   3. convert unnamed json arrays back to csv (first row should be header)
    //   4. parse result with header
    const results = Papa.parse(csv, {
      header: false,
      delimiter: ',',
      columns: true,
      skipEmptyLines: 'greedy'
    })
    csv = Papa.unparse(results.data.slice(skipLines))
  }
  const parsed = Papa.parse(csv, {
    header: true,
    delimiter: ',',
    columns: true,
    skipEmptyLines: 'greedy'
  })

  return parsed
}

function guessUtcOffset (row, station, config) {
  const timestamp = extractTimestamp(row, config)
  const d = dayjs.tz(timestamp, station.timezone)
  if (!d.isValid()) {
    throw new Error(`Failed to guess UTC offset for timestamp (${timestamp}) at time zone (${station.timezone})`)
  }
  return d.utcOffset() / 60
}

function parseValues (values, station, config) {
  if (config.timestamp.timezone.mode === 'GUESS') {
    if (values.length === 0) return []
    const utcOffset = guessUtcOffset(values[0], station, config)
    config.timestamp.timezone.utcOffset = utcOffset
  }

  return values
    .map((d, i) => {
      return {
        datetime: parseTimestamp(d, config),
        value: parseValue(d, config),
        depth_m: parseDepth(d, config)
        // flag_other: parseFlag(d, config)
      }
    })
    .filter(d => d.value !== null)
}

async function processFile (id) {
  if (!id) throw new Error('missing id')

  console.log(`processing file: id=${id}`)
  const file = await File.query()
    .findById(id)
    .throwIfNotFound({
      message: `file not found in database (id=${id})`
    })

  console.log(`type: ${file.type} (id=${file.id})`)

  const relationTable = file.type.toLowerCase()

  // delete existing series/profiles
  await file.$relatedQuery(relationTable).delete()

  // update file status
  await file.$query().patch({
    status: 'PROCESSING',
    error: null
  })

  // read file
  const { data, meta: fileMeta } = await readFile(file, file.config)

  // add row number
  data.forEach((d, i) => { d.$row = i + 1 })

  // validate config
  const config = await validateFileConfig(file.config, fileMeta.fields)

  // get organization
  const organization = await file.$relatedQuery('organization')

  // group by station
  let stationData = []
  if (config.station.mode === 'STATION') {
    const station = await organization.$relatedQuery('stations')
      .findById(config.station.stationId)
      .throwIfNotFound({
        message: `station not found (id=${config.station.stationId})`
      })
    stationData = [{
      stationCode: station.code,
      values: data
    }]
  } else if (config.station.mode === 'COLUMN') {
    const stationColumn = config.station.column
    const d3 = await import('d3')
    stationData = Array.from(
      d3.group(data, d => d[stationColumn]),
      ([key, value]) => ({ stationCode: key, values: value })
    )
  }

  // fetch each station
  for (let i = 0; i < stationData.length; i++) {
    stationData[i].station = await organization.$relatedQuery('stations')
      .where('code', stationData[i].stationCode)
      .first()
      .throwIfNotFound({
        message: `station not found (code=${stationData[i].stationCode})`
      })
  }

  // parse values
  stationData.forEach(d => {
    d.values = parseValues(d.values, d.station, config)
  })

  // series depth
  const seriesDepth = {
    depth_category: config.depth.category,
    depth_m: convertDepthUnits(config.depth.value, config.depth.units)
  }

  // meta
  const meta = {
    accuracy: config.meta.accuracy,
    reviewed: config.meta.reviewed
  }

  const d3 = await import('d3')
  if (config.type === 'SERIES') {
    meta.interval = config.meta.interval
    meta.sop_bath = config.meta.sop_bath

    // save each series
    for (let i = 0; i < stationData.length; i++) {
      const datetimes = stationData[i].values.map(d => d.datetime)
      const datetimeExtent = d3.extent(datetimes)
      const frequency = await medianFrequency(datetimes)

      stationData[i].series = await stationData[i].station.$relatedQuery('series').insertGraph({
        file_id: file.id,
        values: stationData[i].values,
        start_datetime: datetimeExtent[0],
        end_datetime: datetimeExtent[1],
        frequency,
        ...seriesDepth,
        ...meta
      })
    }
  } else if (config.type === 'PROFILES') {
    for (let i = 0; i < stationData.length; i++) {
      const stationProfiles = Array.from(
        d3.group(stationData[i].values, d => d.datetime.substr(0, 10)),
        ([key, value]) => ({ date: key, values: value, file_id: file.id, ...meta })
      )
      stationData[i].profiles = await stationData[i].station
        .$relatedQuery('profiles')
        .insertGraph(stationProfiles)
    }
  }

  // update file status
  await file.$query().patch({
    status: 'DONE'
  })

  return file
}

async function processFiles (ids, options) {
  let files = []
  if (options.all) {
    files = await File.query().where('status', 'UPLOADED')
  } else {
    files = await File.query().findByIds(ids.map(id => +id))
  }

  if (files.length === 0) {
    throw new Error('No files found')
  }

  const success = []
  const failed = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    try {
      await processFile(file.id, options)
      success.push(file)
    } catch (e) {
      await file.$query().patch({
        status: 'FAILED',
        error: e.message || e.toString()
      })
      failed.push({
        error: e,
        file
      })
    }
  }

  return { success, failed }
}

module.exports = async function (ids, options) {
  try {
    const { success, failed } = await processFiles(ids, options)
    console.log(`finished: success=${success.length} failed=${failed.length}`)
    success.forEach(d => {
      console.log(`success: ${d.filename} (id=${d.id})`)
    })
    failed.forEach(d => {
      console.log(`failed: ${d.file.filename} (id=${d.file.id},error=${d.error.message || d.error.toString()})`)
    })
  } catch (e) {
    console.log(`failed: ${e.message || e.toString()}`)
    throw e
  }
}
