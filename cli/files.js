const { readFileSync, createReadStream, existsSync } = require('fs')
const path = require('path')
const Papa = require('papaparse')

const { findOrganizationById } = require('./organizations')
const { s3 } = require('./lib/aws')
const { File } = require('../db/models')
const { printTable } = require('./lib/utils')

function printFiles (rows) {
  printTable(rows, ['id', 'organization_id', 'uuid', 'filename', 'status'])
}

exports.listFiles = async function (options) {
  const rows = await File.query().orderBy('id')
  printFiles(rows)
}

const createAndUploadFile = async function (filepath, config, { organizationId, ...options }) {
  // check data file exists
  if (!existsSync(filepath)) {
    throw new Error(`file not found (${filepath})`)
  }

  // fetch organization
  const org = await findOrganizationById(organizationId)

  // create file instance
  const file = await org.$relatedQuery('files').insert({
    filename: path.basename(filepath),
    config,
    status: 'CREATED'
  }).returning('*')

  // upload to s3
  const stream = createReadStream(filepath)
  const s3Response = await s3.upload({
    Bucket: process.env.AWS_S3_STORAGE_BUCKET,
    Key: `files/${file.uuid}/${file.filename}`,
    Body: stream
  }).promise()

  // update s3 and status
  await file.$query().patch({
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

exports.importFiles = async function (filepath, { organizationId, configFile, directory, ...options }) {
  if (!existsSync(filepath)) {
    throw new NotFoundError(`file not found (${filepath})`)
  }

  // read default config
  const defaultConfig = await readConfig(configFile)

  // read filelist file
  const csv = readFileSync(filepath).toString()
  const parsed = Papa.parse(csv, {
    header: true,
    comments: '#',
    delimiter: ',',
    columns: true,
    skipEmptyLines: 'greedy'
  })

  if (parsed.errors.length > 0) {
    console.log(parsed.errors)
    throw new Error('failed to parse filelist')
  }

  const fileList = parsed.data
  const files = []
  const failed = []

  for (let i = 0; i < fileList.length; i++) {
    const { filename, ...fileOptions } = fileList[i]
    console.log(`importing: ${filename}`)

    const filepath = path.join(directory, filename)
    const config = {
      station: {
        code: fileOptions.station_code
      },
      ...defaultConfig
    }
    try {
      const file = await createAndUploadFile(filepath, config, { organizationId, ...options })
      files.push(file)
    } catch (e) {
      console.log(`failed (${filename}): {e.toString()}`)
      failed.push({ filename })
    }
  }

  console.log(`successfully uploaded ${files.length} files`)
  printFiles(files)

  if (failed.length > 0) {
    console.log(`failed files: ${failed.join(', ')}`)
  }
}

exports.deleteFile = async function (id) {
  const file = await File.query().findById(id)
  if (!file) {
    throw new NotFoundError(`file not found (id=${id})`)
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
