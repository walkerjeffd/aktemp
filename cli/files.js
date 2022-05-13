const { readFileSync, createReadStream, existsSync } = require('fs')
const path = require('path')
const Papa = require('papaparse')
const stripBom = require('strip-bom')

const { findOrganizationByCode } = require('./organizations')
const { s3 } = require('./lib/aws')
const { File } = require('../db/models')
const { printTable } = require('./lib/utils')
const { validateFileConfig } = require('../batch/lib/validators')

function printFiles (rows) {
  printTable(rows, ['id', 'organization_code', 'filename', 'created_at', 'status'])
}

exports.listFiles = async function (options) {
  const rows = await File.query().modify('organizationCode').orderBy('id')
  printFiles(rows)
}

const createAndUploadFile = async function (file, filepath, organization, options) {
  // check data file exists
  if (!existsSync(filepath)) {
    throw new Error(`file not found (${filepath})`)
  }

  // create file instance
  const dbFile = await organization.$relatedQuery('files').insert({
    ...file,
    status: 'CREATED'
  }).returning('*')

  // upload to s3
  const stream = createReadStream(filepath)
  const s3Response = await s3.upload({
    Bucket: process.env.AWS_S3_STORAGE_BUCKET,
    Key: `files/${dbFile.uuid}/${dbFile.filename}`,
    Body: stream
  }).promise()

  // update s3 and status
  await dbFile.$query().patch({
    s3: s3Response,
    status: 'UPLOADED'
  })

  return file
}

function readConfig (configFile) {
  const configRawData = readFileSync(configFile)
  return JSON.parse(configRawData)
}

exports.createFile = async function (filepath, { configFile, ...options }) {
  const config = await readConfig(configFile)

  const file = await createAndUploadFile(filepath, config, options)
  printFiles([file])
}

async function generateFileConfig (d, organization) {
  const station = await organization.$relatedQuery('stations')
    .where('code', d.station_code)
    .first()

  if (!station) throw new Error(`Station not found (code=${d.station_code})`)

  const config = {
    type: d.type,
    station: {},
    depth: {},
    timestamp: {
      timezone: {}
    },
    value: {},
    meta: {}
  }

  config.station = {
    mode: 'STATION',
    stationId: station.id
  }

  switch (d.depth_mode) {
    case 'UNKNOWN':
      config.depth.mode = 'UNKNOWN'
      break
    case 'COLUMN':
      config.depth.mode = 'COLUMN'
      config.depth.column = d.depth_value
      config.depth.units = 'm'
      break
    case 'VALUE':
      config.depth.mode = 'VALUE'
      config.depth.value = d.depth_value
      config.depth.units = 'm'
      break
    case 'CATEGORY':
      config.depth.mode = 'VALUE'
      config.depth.value = d.depth_value
      break
    default:
      config.depth.mode = 'UNKNOWN'
  }

  if (d.time_column.length) {
    config.timestamp.columns = [d.date_column, d.time_column]
  } else {
    config.timestamp.columns = [d.date_column]
  }

  switch (d.timezone_mode) {
    case 'TIMESTAMP':
      config.timestamp.timezone.mode = 'TIMESTAMP'
      break
    case 'COLUMN':
      config.timestamp.timezone.mode = 'COLUMN'
      config.timestamp.timezone.column = d.timezone_value
      break
    case 'UTCOFFSET':
      config.timestamp.timezone.mode = 'UTCOFFSET'
      config.timestamp.timezone.utcOffset = d.timezone_value
      break
  }

  config.value = {
    column: d.value_column,
    units: d.value_units,
    missing: d.value_missing ? d.value_missing.split(';') : []
  }

  config.meta = {
    interval: d.interval,
    accuracy: d.accuracy === 'UNKNOWN' ? undefined : d.accuracy,
    sop_bath: d.sop_bath === 'UNKNOWN' ? undefined : d.sop_bath,
    reviewed: d.reviewed === 'UNKNOWN' ? undefined : d.reviewed
  }

  return config
}

function readFile (file) {
  const csv = readFileSync(file).toString()
  const parsed = Papa.parse(stripBom(csv), {
    header: true,
    comments: '#',
    delimiter: ',',
    columns: true,
    skipEmptyLines: 'greedy'
  })

  return parsed
}

exports.importFiles = async function (filepath, { organizationCode, directory, ...options }) {
  if (!existsSync(filepath)) {
    throw new Error(`file not found (${filepath})`)
  }

  // fetch organization
  const organization = await findOrganizationByCode(organizationCode)

  // read manifest file
  console.log(`reading manifest: ${filepath}`)
  const csv = readFileSync(filepath).toString()
  const manifest = Papa.parse(stripBom(csv), {
    header: true,
    comments: '#',
    delimiter: ',',
    columns: true,
    skipEmptyLines: 'greedy'
  })

  if (manifest.errors.length > 0) {
    console.log(manifest.errors)
    throw new Error('failed to parse manifest')
  }

  console.log(`processing: ${manifest.data.length} files`)

  // process
  const rows = manifest.data
  const files = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const filename = row.filename
    console.log(`validating file: ${filename}`)

    const config = await generateFileConfig(row, organization)
    const filepath = path.join(directory, filename)
    const parsed = readFile(filepath)
    if (parsed.errors.length > 0) {
      console.log(parsed.errors)
      throw new Error(`failed to read file (${filepath})`)
    }
    const fields = parsed.meta.fields
    await validateFileConfig(config, fields)
    files.push({
      filename,
      type: config.type,
      config
    })
  }

  const saved = []
  const failed = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    console.log(`uploading: ${file.filename}`)

    const filepath = path.join(directory, file.filename)
    try {
      const savedFile = await createAndUploadFile(file, filepath, organization, options)
      saved.push(savedFile)
    } catch (e) {
      console.log(`failed (${file.filename}): {e.toString()}`)
      failed.push(file)
    }
  }

  console.log(`files uploaded (n=${saved.length})`)
  printFiles(saved)

  if (failed.length > 0) {
    console.log(`failed to upload (n=${failed.length}):`)
    printTable(failed, ['filename'])
  }
}

exports.deleteFile = async function (id) {
  const file = await File.query().findById(id)
  if (!file) {
    throw new Error(`file not found (id=${id})`)
  }

  if (file.s3) {
    const { Key, Bucket } = file.s3
    console.log(`deleting file from s3 (id=${id}, Bucket=${Bucket}, Key=${Key})`)
    await s3.deleteObject({ Key, Bucket }).promise()
  }

  const nrow = await file.$query().delete()

  if (nrow > 0) {
    console.log(`deleted file successfully (id=${id})`)
  } else {
    console.log(`failed to delete file (id=${id})`)
  }
}

exports.processFiles = require('../batch/lib/processors')
