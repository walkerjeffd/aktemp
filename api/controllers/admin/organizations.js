const createError = require('http-errors')

const { Organization } = require('../../db/models')

async function getOrganizations (req, res, next) {
  const rows = await Organization.query()
    .withGraphFetched('users')
  return res.status(200).json(rows)
}

async function postOrganizations (req, res, next) {
  const row = await Organization.query().insert(req.body).returning('*')
  return res.status(201).json(row)
}

const attachOrganization = async (req, res, next) => {
  const row = await Organization.query()
    .withGraphFetched('users')
    .findById(req.params.organizationId)

  if (!row) throw createError(404, `Organization (id=${req.params.organizationId}) not found`)

  res.locals.organization = row
  return next()
}

const getOrganization = async (req, res, next) => {
  return res.status(200).json(res.locals.organization)
}

const putOrganization = async (req, res, next) => {
  const row = await res.locals.organization.$query()
    .patchAndFetch(req.body)
  return res.status(200).json(row)
}

const deleteOrganization = async (req, res, next) => {
  const deletedCount = await res.locals.organization.$query()
    .delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete organization (id = ${res.locals.organization.id})`)
  }

  return res.status(204).json()
}

module.exports = {
  getOrganizations,
  postOrganizations,
  attachOrganization,
  getOrganization,
  putOrganization,
  deleteOrganization
}
