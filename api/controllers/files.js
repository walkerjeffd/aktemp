const createError = require('http-errors')

const { batch, createPresignedPostPromise } = require('../aws')
const { File, Organization } = require('../db/models')

const attachFile = async (req, res, next) => {
  let file = null
  if (res.locals.organization) {
    file = await res.locals.organization.$relatedQuery('files')
      .findById(req.params.fileId)
  } else {
    file = await File.query()
      .findById(req.params.fileId)
  }

  if (!file) {
    throw createError(404, `File (id=${req.params.fileId}) not found`)
  }

  res.locals.file = file
  return next()
}

const getUserFiles = async (req, res, next) => {
  const files = await Organization.relatedQuery('files')
    .for(res.locals.user.organizations.map(d => d.id))
  return res.status(200).json(files)
}

const getOrganizationFiles = async (req, res, next) => {
  const rows = await res.locals.organization.$relatedQuery('files')
  return res.status(200).json(rows)
}

const getAllFiles = async (req, res, next) => {
  const files = await File.query()
  return res.status(200).json(files)
}

const postFiles = async (req, res, next) => {
  const { filename, config } = req.body
  const props = {
    user_id: req.auth.id,
    filename,
    config,
    status: 'CREATED'
  }

  let row = await res.locals.organization.$relatedQuery('files')
    .insert(props)
    .returning('*')

  if (process.env.NODE_ENV === 'test') {
    row = await row.$query().patchAndFetch({
      s3: {
        Bucket: 'test-bucket',
        Key: `files/${row.uuid}/${row.filename}`
      }
    })
    row.presignedUrl = {
      url: 'test-url'
    }
  } else {
    const presignedUrl = await createPresignedPostPromise({
      Bucket: process.env.AWS_S3_DATA_BUCKET,
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
    row.presignedUrl = presignedUrl
  }

  return res.status(201).json(row)
}

const getFile = (req, res, next) => res.status(200).json(res.locals.file)

const putFile = async (req, res, next) => {
  const row = await res.locals.file.$query()
    .patchAndFetch(req.body)
  return res.status(200).json(row)
}

const deleteFile = async (req, res, next) => {
  const deletedCount = await res.locals.file.$query()
    .delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete file (id=${res.locals.file.id})`)
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
  getAllFiles,
  getUserFiles,
  getOrganizationFiles,
  postFiles,
  attachFile,
  getFile,
  putFile,
  deleteFile,
  processFile
}
