const AWS = require('aws-sdk')
const Papa = require('papaparse')
const stripBom = require('strip-bom')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone.js')
const utc = require('dayjs/plugin/utc.js')

const { validateFileConfig } = require('./validators.js')
const { parseTimestamp, parseValue, parseFlag, parseDepth } = require('./parsers.js')
const { convertDepthUnits } = require('./utils.js')
const { File } = require('../db/models/index.js')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.tz.setDefault('UTC')

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.AWS_REGION
})

async function readFile (file) {
  const { Bucket, Key } = file.s3
  const object = await s3.getObject({ Bucket, Key }).promise()
  const csv = stripBom(object.Body.toString())

  const parsed = Papa.parse(csv, {
    header: true,
    comments: '#',
    delimiter: ',',
    columns: true,
    skipEmptyLines: 'greedy'
  })

  return parsed
}

async function processFile (id) {
  console.log(`processing file: id=${id}`)
  const file = await File.query()
    .findById(id)
    .throwIfNotFound({
      message: `file not found in database (id=${id})`
    })

  console.log(file)

  // let results
  // if (file.type === 'series') {
  //   results = processSeriesFile(file)
  // } else if (file.type === 'profiles') {
  //   // results = processProfilesFile(file)
  // } else {
  //   throw new Error('Invalid file type, should be \'series\' or \'profiles\'')
  // }
  const results = processSeriesFile(file)

  return results
}

function parseSeriesValues (values, config) {
  return values.map((d, i) => {
    return {
      datetime: parseTimestamp(d, config),
      value: parseValue(d, config),
      depth_m: parseDepth(d, config),
      flag_other: parseFlag(d, config)
    }
  })
}

async function processSeriesFile (file) {
  if (!file) throw new Error('missing file')
  console.log(`processing series file: id=${file.id}`)

  // delete existing series
  await file.$relatedQuery('series').delete()

  // update file status
  await file.$query().patch({
    status: 'PROCESSING',
    error: null
  })

  // read file
  const { data, meta } = await readFile(file)

  // add row number
  data.forEach((d, i) => { d.$row = i + 1 })

  // validate config
  const config = await validateFileConfig(file.config, meta.fields)

  // get organization
  const organization = await file.$relatedQuery('organization')

  // group by station
  let stationData = []
  if (config.station.mode === 'station') {
    const station = await organization.$relatedQuery('stations')
      .findById(config.station.stationId)
      .throwIfNotFound({
        message: `station not found (id=${config.station.stationId})`
      })
    stationData = [{
      stationCode: station.code,
      values: data
    }]
  } else if (config.station.mode === 'column') {
    const stationColumn = config.station.column
    const d3 = await import('d3')
    stationData = Array.from(
      d3.group(data, d => d[stationColumn]),
      ([key, value]) => ({ stationCode: key, values: value })
    )
  }

  // parse values
  stationData.forEach(d => {
    d.values = parseSeriesValues(d.values, config)
  })

  // fetch each station
  for (let i = 0; i < stationData.length; i++) {
    stationData[i].station = await organization.$relatedQuery('stations')
      .where('code', stationData[i].stationCode)
      .first()
      .throwIfNotFound({
        message: `station not found (code=${stationData[i].stationCode})`
      })
  }

  // series depth
  const seriesDepth = {}
  if (file.config.depth.mode === 'category') {
    seriesDepth.depth_category = file.config.depth.category
  } else if (file.config.depth.mode === 'value') {
    seriesDepth.depth_m = convertDepthUnits(file.config.depth.value, file.config.depth.units)
  }

  // series meta
  const seriesMeta = {
    ...file.config.meta
  }

  // save each series
  for (let i = 0; i < stationData.length; i++) {
    const d3 = await import('d3')
    const seriesDateRange = d3.extent(stationData[i].values, d => d.datetime)
    stationData[i].series = await stationData[i].station.$relatedQuery('series').insertGraph({
      file_id: file.id,
      values: stationData[i].values,
      start_datetime: seriesDateRange[0],
      end_datetime: seriesDateRange[1],
      ...seriesDepth,
      ...seriesMeta
    })
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
