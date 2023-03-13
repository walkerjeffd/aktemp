const createError = require('http-errors')

const { Organization } = require('aktemp-db/models')

async function getOrganizations (req, res, next) {
  const rows = await Organization.query()
    .withGraphFetched('providers')
  return res.status(200).json(rows)
}

async function postOrganizations (req, res, next) {
  const row = await Organization.query()
    .insert(req.body)
    .returning('*')
  if (req.body.providers && req.body.providers.length > 0) {
    await row.$relatedQuery('providers').relate(req.body.providers)
  }
  return res.status(201).json(row)
}

const attachOrganization = async (req, res, next) => {
  const row = await Organization.query()
    .withGraphFetched('providers')
    .findById(req.params.organizationId)

  if (!row) throw createError(404, `Organization (id=${req.params.organizationId}) not found`)

  res.locals.organization = row
  return next()
}

const getOrganization = async (req, res, next) => {
  return res.status(200).json(res.locals.organization)
}

const putOrganization = async (req, res, next) => {
  await res.locals.organization.$query()
    .patchAndFetch(req.body)
  if (req.body.providers) {
    await res.locals.organization.$relatedQuery('providers').unrelate()
    await res.locals.organization.$relatedQuery('providers').relate(req.body.providers || [])
  }
  const row = await Organization.query()
    .withGraphFetched('providers')
    .findById(req.params.organizationId)
  return res.status(200).json(row)
}

const deleteOrganization = async (req, res, next) => {
  const deletedCount = await res.locals.organization.$query()
    .delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete organization (id=${res.locals.organization.id})`)
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
