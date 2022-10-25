const createError = require('http-errors')

const { Organization } = require('aktemp-db/models')

const attachOrganization = async (req, res, next) => {
  const row = await Organization.query()
    .withGraphFetched('users')
    .findById(req.params.organizationId)

  if (!row) throw createError(404, `Organization (id=${req.params.organizationId}) not found`)

  res.locals.organization = row
  return next()
}

const getOrganizations = async (req, res, next) => {
  const organizations = await Organization.query()
    .orderBy('code')
  return res.status(200).json(organizations)
}

module.exports = {
  attachOrganization,
  getOrganizations
}
