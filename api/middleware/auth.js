const createError = require('http-errors')
const jwt = require('jsonwebtoken')
const { isLambda } = require('../utils')

function getCurrentInvokeHeader (token) {
  if (!token) throw createError(401, 'Unauthorized')
  const decoded = jwt.decode(token)
  if (decoded['cognito:groups']) {
    decoded['cognito:groups'] = decoded['cognito:groups'].join(',')
  }
  return {
    requestContext: {
      authorizer: {
        claims: decoded
      }
    }
  }
}

const cognitoAuth = async (req, res, next) => {
  let event
  if (isLambda()) {
    ({ event } = req.apiGateway)
    console.log('apiGateway.event', event)
  } else {
    event = getCurrentInvokeHeader(req.headers.authorization)
  }

  const claims = event &&
    event.requestContext &&
    event.requestContext.authorizer &&
    event.requestContext.authorizer.claims
  if (claims) {
    const groups = claims['cognito:groups'] ? claims['cognito:groups'].split(',') : []
    const isAdmin = groups.includes('admins')
    req.auth = {
      id: claims.sub,
      type: 'cognito',
      isAdmin
    }
    return next()
  } else {
    return next(createError(401, 'Unauthorized'))
  }
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

  // auth user does not have access to requested provider
  if (res.locals.user.providers.map(d => d.id).includes(res.locals.station.provider_id)) {
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

const requireProviderAccessOrAdmin = (req, res, next) => {
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

  // auth user does not have access to requested provider
  if (!res.locals.user.providers.map(d => d.id).includes(+req.params.providerId)) {
    return next(createError(401, 'Unauthorized'))
  }

  next()
}

module.exports = {
  cognitoAuth,
  requireAdmin,
  requireUserOrAdmin,
  requireStationAccessOrAdmin,
  requireProviderAccessOrAdmin
}
