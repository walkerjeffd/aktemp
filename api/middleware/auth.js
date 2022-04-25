const createError = require('http-errors')

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
    req.auth = {
      id: claims.sub,
      type: 'cognito',
      isAdmin
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

const requireUserOrAdmin = (req, res, next) => {
  // no user
  if (!res.locals.user) {
    return next(createError(404, 'User not found'))
  }

  // no auth
  if (!req.auth) {
    return next(createError(401, 'Unauthorized'))
  }

  // admin override
  if (req.auth.isAdmin) {
    return next()
  }

  // auth user does not match req user
  if (res.locals.user.id !== req.auth.userId) {
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

const requireStationAccessOrAdmin = (req, res, next) => {
  // no auth
  if (!req.auth) {
    return next(createError(401, 'Unauthorized'))
  }

  // no user
  if (!res.locals.user) {
    return next(createError(404, 'User not found'))
  }

  // admin override
  if (req.auth.isAdmin) {
    return next()
  }

  // auth user does not have access to requested organization
  if (res.locals.user.organizations.map(d => d.id).includes(res.locals.station.organization_id)) {
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

const requireOrganizationAccessOrAdmin = (req, res, next) => {
  // no auth
  if (!req.auth) {
    return next(createError(401, 'Unauthorized'))
  }

  // no user
  if (!res.locals.user) {
    return next(createError(404, 'User not found'))
  }

  // admin override
  if (req.auth.isAdmin) {
    return next()
  }

  // auth user does not have access to requested organization
  if (res.locals.user.organizations.map(d => d.id).includes(req.params.organizationId)) {
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

module.exports = {
  cognitoAuth,
  requireAdmin,
  requireUserOrAdmin,
  requireStationAccessOrAdmin,
  requireOrganizationAccessOrAdmin
}
