const createError = require('http-errors')

const { Organization } = require('../db/models')

const attachOrganization = async (req, res, next) => {
  const row = await Organization.query()
    .findById(req.params.organizationId)

  if (!row) throw createError(404, `Organization (id=${req.params.organizationId}) not found`)

  res.locals.organization = row
  return next()
}

module.exports = {
  attachOrganization
}
