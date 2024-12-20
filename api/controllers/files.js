const createError = require('http-errors')

const { batch, createPresignedPostPromise } = require('../aws')
const { File, Provider } = require('aktemp-db/models')

async function attachFile (req, res, next) {
  let query = null
  if (res.locals.provider) {
    query = res.locals.provider.$relatedQuery('files')
      .findById(req.params.fileId)
  } else {
    query = File.query()
      .withGraphFetched('series(stationProvider,filename).flags')
      .withGraphFetched('profiles(stationProvider,valuesSummary,filename).values')
      .findById(req.params.fileId)
  }
  const file = await query.modify('providerCode')

  if (!file) {
    throw createError(404, `File (id=${req.params.fileId}) not found`)
  }

  res.locals.file = file
  return next()
}

async function getUserFiles (req, res, next) {
  const files = await Provider.relatedQuery('files')
    .for(res.locals.user.providers.map(d => d.id))
  return res.status(200).json(files)
}

async function getProviderFiles (req, res, next) {
  const rows = await res.locals.provider.$relatedQuery('files')
  return res.status(200).json(rows)
}

async function getAllFiles (req, res, next) {
  const files = await File.query()
  return res.status(200).json(files)
}

async function postFiles (req, res, next) {
  const { filename, type, config } = req.body
  const props = {
    user_id: req.auth.id,
    filename,
    type,
    config,
    status: 'CREATED'
  }

  let row = await res.locals.provider.$relatedQuery('files')
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
      Bucket: process.env.STORAGE_BUCKET,
      Fields: {
        key: `files/${row.uuid}/${row.filename}`
      },
      Expires: 60 * 60 * 1 // one hour
    })
    const s3 = {
      Bucket: presignedUrl.fields.bucket,
      Key: presignedUrl.fields.key
    }
    row = await row.$query().patchAndFetch({
      s3,
      url: `https://${s3.Bucket}.s3.amazonaws.com/${s3.Key}`
    })
    row.presignedUrl = presignedUrl
  }

  return res.status(201).json(row)
}

function getFile (req, res, next) {
  return res.status(200).json(res.locals.file)
}

async function putFile (req, res, next) {
  const row = await res.locals.file.$query()
    .patchAndFetch(req.body)
  return res.status(200).json(row)
}

async function deleteFile (req, res, next) {
  const deletedCount = await res.locals.file.$query()
    .delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete file (id=${res.locals.file.id})`)
  }

  return res.status(204).json()
}

async function processFile (req, res, next) {
  // console.log(`process dataset (id=${res.locals.dataset.id})`)
  await batch.submitJob({
    jobName: `process-file-${res.locals.file.id}`,
    jobDefinition: process.env.JOB_DEFINITION,
    jobQueue: process.env.JOB_QUEUE,
    containerOverrides: {
      command: [
        'node',
        'index.js',
        'files',
        'process',
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
  getUserFiles,
  getProviderFiles,
  getAllFiles,
  postFiles,
  getFile,
  putFile,
  deleteFile,
  processFile
}
