const createError = require('http-errors')

const { notify } = require('../aws')
const { verifyRecaptcha } = require('../utils')
const { Request } = require('aktemp-db/models')

function newRequestMessage (params) {
  const d = new Date()
  return `New account requested

Name: ${params.name}
Email: ${params.email}
Provider: ${params.provider_name} (${params.provider_code})
Description: ${params.description}
Submitted: ${d.toLocaleString('en-US', { timeZone: 'America/Anchorage', timeZoneName: 'short' })}
`
}

function resendPasswordMessage (params) {
  const d = new Date()
  return `New temporary password requested

Email: ${params.email}
Submitted: ${d.toLocaleString('en-US', { timeZone: 'America/Anchorage', timeZoneName: 'short' })}
`
}

const getRequests = async (req, res, next) => {
  const rows = await Request.query()
  return res.status(200).json(rows)
}

const postRequests = async (req, res, next) => {
  if (!req.body.resend) {
    try {
      await verifyRecaptcha(req)
    } catch (err) {
      console.log(err)
      throw createError(403, 'Failed to verify reCAPTCHA, please try again')
    }
    delete req.body['g-recaptcha-response']
  }
  try {
    if (req.body.resend) {
      await notify('New Temporary Password Request', resendPasswordMessage(req.body))
      return res.status(201).json({ message: 'New temporary password requested' })
    } else {
      const row = await Request.query().insert(req.body).returning('*')
      await notify('New Account Request', newRequestMessage(req.body))
      return res.status(201).json({ message: 'Account requested', data: row })
    }
  } catch (err) {
    console.log(err)
    throw createError(500, 'Failed to request account (Server Error)')
  }
}

const attachRequest = async (req, res, next) => {
  const row = await Request.query()
    .findById(req.params.requestId)
  if (!row) throw createError(404, `Request (id=${req.params.requestId}) not found`)
  res.locals.request = row
  return next()
}

const getRequest = async (req, res, next) => {
  return res.status(200).json(res.locals.request)
}

const putRequest = async (req, res, next) => {
  const row = await Request.query().patchAndFetchById(res.locals.request.id, req.body)
  return res.status(200).json(row)
}

const deleteRequest = async (req, res, next) => {
  const nrow = await Request.query().deleteById(res.locals.request.id)
  if (nrow === 0) {
    throw createError(500, `Failed to delete request (id=${res.locals.request.id})`)
  }
  return res.status(204).json()
}

module.exports = {
  attachRequest,
  getRequests,
  postRequests,
  getRequest,
  putRequest,
  deleteRequest
}
