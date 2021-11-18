const AWS = require('aws-sdk')
const Papa = require('papaparse')
const stripBom = require('strip-bom')
const Joi = require('joi')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')

dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.tz.setDefault('UTC')

const { File } = require('../db/models')

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.AWS_REGION
})

function validateConfig (config, fields) {
  const fileColumn = Joi.string().valid(...fields)
  const schema = Joi.object({
    timestamp: Joi.object({
      column: fileColumn.required()
      // timeColumn: fileColumn.allow(null),
      // utcOffset: Joi.number().required()
    }).required(),
    temperature: Joi.object({
      column: fileColumn.required()
    }).required(),
    station: Joi.object({
      code: Joi.string()
    }).required()
  })

  const { error, value } = schema.validate(config)

  if (error) {
    // console.error(error)
    throw new Error(`Invalid config object (${error.toString()})`)
  }

  return value
}

async function readAndParseFile (file) {
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
  console.log(`processing: id=${id}`)
  const file = await File.query()
    .findById(id)
    .throwIfNotFound({
      message: `file not found in database (id=${id})`
    })

  // stop if series exist
  await file.$relatedQuery('series').delete()

  // update file status
  await file.$query().patch({
    status: 'PROCESSING'
  })

  // read file
  const { data, meta } = await readAndParseFile(file)

  // validate config
  const config = await validateConfig(file.config, meta.fields)

  // get organization
  const org = await file.$relatedQuery('organization')

  // get station
  const station = await org.$relatedQuery('stations')
    .where('code', config.station.code)
    .first()
    .throwIfNotFound({
      message: `station not found (code=${config.station.code})`
    })

  // parse values
  const values = data.map((d, i) => {
    const rawTimestamp = d[config.timestamp.column]
    const parsedTimestamp = dayjs(rawTimestamp)
    if (!parsedTimestamp.isValid()) {
      throw new Error(`failed to parse timestamp at row ${i.toLocaleString()} ("${rawTimestamp}").`)
    }
    const parsedValue = Number(d[config.temperature.column])
    return {
      datetime: parsedTimestamp.toISOString(),
      value: parsedValue
    }
  })

  // create series
  await station.$relatedQuery('series').insertGraph({
    file_id: file.id,
    values
  })

  // update file status
  await file.$query().patch({
    status: 'DONE'
  })

  return file
}

async function processFiles (ids, options) {
  let files = []
  if (options.all) {
    files = await File.query()
      .where('status', 'UPLOADED')
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
      await file.patch({
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

module.exports = async function (id, options) {
  try {
    const { success, failed } = await processFiles(id, options)
    if (success.length > 0) {
      console.log(`success (n=${success.length})`)
      success.forEach(d => {
        console.log(`  ${d.filename} (id=${d.id})`)
      })
    }
    if (failed.length > 0) {
      console.log(`failed (n=${failed.length})`)
      failed.forEach(d => {
        console.log(`  ${d.file.filename} (id=${d.file.id}): ${d.error.message || d.error.toString()}`)
      })
    }
  } catch (e) {
    console.log(`failed to process files: ${e.message || e.toString()}`)
    throw e
  }
}
