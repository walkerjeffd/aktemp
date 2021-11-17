const createError = require('http-errors')
const { User } = require('../db/models')

const cognitoAuth = async (req, res, next) => {
  const claims = req.apiGateway &&
    req.apiGateway.event &&
    req.apiGateway.event.requestContext &&
    req.apiGateway.event.requestContext.authorizer &&
    req.apiGateway.event.requestContext.authorizer.claims

  if (claims) {
    const claims = req.apiGateway.event.requestContext.authorizer.claims
    const groups = claims['cognito:groups'] ? claims['cognito:groups'].split(',') : []
    const isAdmin = groups.includes('admins')
    const dbUser = await User.query().findById(claims.sub)
    req.auth = {
      type: 'cognito',
      user: claims.sub,
      isAdmin,
      organizationId: dbUser && dbUser.organization_id
    }
  } else {
    return next(createError(401, 'Unauthorized'))
  }
  next()
}

function requireAdmin (req, res, next) {
  if (!req.auth || !req.auth.isAdmin) {
    return next(createError(401, 'Unauthorized'))
  }
  next()
}

const requireOrganizationOrAdmin = (req, res, next) => {
  // no organization
  if (!res.locals.organization) {
    return next(createError(404, 'Organization not found'))
  }

  // no auth
  if (!req.auth) {
    return next(createError(401, 'Unauthorized'))
  }

  // admin override
  if (req.auth.isAdmin) {
    return next()
  }

  // user does not belong to requested organization
  if (res.locals.organization.id !== req.auth.organizationId) {
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

module.exports = {
  cognitoAuth,
  requireAdmin,
  requireOrganizationOrAdmin
}
