const createError = require('http-errors')

const { batch, createPresignedPostPromise } = require('../aws')
const { File } = require('../db/models')

const attachFile = async (req, res, next) => {
  let file = null
  if (res.locals.file) {
    file = await res.locals.station.$relatedQuery('files')
      .findById(req.params.fileId)
  } else {
    file = await File.query()
      .findById(req.params.fileId)
  }

  if (!file) {
    throw createError(404, `File (id=${req.params.fileId}) not found${res.locals.station ? ' for station (id=' + res.locals.station.id + ')' : ''}`)
  }

  res.locals.file = file
  return next()
}

const postFiles = async (req, res, next) => {
  const props = {
    ...req.body,
    status: 'CREATED'
  }
  const rows = await File.query()
    .insert(props)
    .returning('*')
  let row = rows[0]

  const presignedUrl = await createPresignedPostPromise({
    Bucket: process.env.BUCKET,
    Fields: {
      key: `files/${row.uuid}/${row.filename}`
    },
    Expires: 60 * 60 * 1 // one hour
  })
  row = await row.$query().patchAndFetch({
    s3: {
      Bucket: presignedUrl.fields.bucket,
      Key: presignedUrl.fields.key
    }
  })

  const response = {
    ...row,
    presignedUrl
  }
  return res.status(201).json(response)
}

const putFile = async (req, res, next) => {
  const row = await res.locals.file.$query()
    .patchAndFetch(req.body)
  return res.status(200).json(row)
}

const deleteFile = async (req, res, next) => {
  const deletedCount = await res.locals.file.$query()
    .delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete file (id = ${res.locals.file.id})`)
  }

  return res.status(204).json()
}

const processFile = async (req, res, next) => {
  // console.log(`process dataset (id=${res.locals.dataset.id})`)
  await batch.submitJob({
    jobName: `process-file-${res.locals.file.id}`,
    jobDefinition: process.env.JOB_DEFINITION,
    jobQueue: process.env.JOB_QUEUE,
    containerOverrides: {
      command: [
        'node',
        'process.js',
        'files',
        res.locals.file.id.toString()
      ]
    }
  }).promise()

  const row = await res.locals.file.$query()
    .patchAndFetch({ status: 'QUEUED' })

  return res.status(200).json(row)
}

module.exports = {
  attachFile,
  postFiles,
  putFile,
  deleteFile,
  processFile
}
