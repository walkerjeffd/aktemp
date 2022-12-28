const createError = require('http-errors')
const { Download } = require('aktemp-db/models')
const { batch } = require('../aws')
const { verifyRecaptcha } = require('../utils')

const postDownloads = async (req, res, next) => {
  try {
    await verifyRecaptcha(req)
  } catch (err) {
    console.log(err)
    throw createError(403, 'Failed to verify reCAPTCHA, please try again')
  }

  delete req.body['g-recaptcha-response']
  const props = {
    config: req.body,
    status: 'CREATED'
  }

  let row
  try {
    row = await Download
      .query()
      .insert(props)
      .returning('*')
  } catch (err) {
    console.log(err)
    throw createError(500, 'Failed to submit download request (Server Error)')
  }

  try {
    await batch.submitJob({
      jobName: `process-download-${row.id}`,
      jobDefinition: process.env.JOB_DEFINITION,
      jobQueue: process.env.JOB_QUEUE,
      containerOverrides: {
        command: [
          'node',
          'index.js',
          'downloads',
          'process',
          row.id.toString()
        ]
      }
    }).promise()

    row = await row.$query()
      .patchAndFetch({ status: 'QUEUED' })
    return res.status(201).json(row)
  } catch (err) {
    console.log(err)
    await row.$query()
      .patchAndFetch({ status: 'FAILED', error: err.toString() })
    return res.status(500).json({ message: 'Failed to queue download request (Server Error)' })
  }
}

module.exports = {
  postDownloads
}
