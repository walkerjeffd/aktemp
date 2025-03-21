const express = require('express')
const asyncHandler = require('express-async-handler')
const basicAuth = require('express-basic-auth')
const createError = require('http-errors')

const { cognitoAuth } = require('../../middleware/auth')
const { User, Provider } = require('aktemp-db/models/index')

const router = express.Router()

const users = {
  admin: {
    password: 'admin',
    isAdmin: true
  },
  user: {
    id: 'abc-123',
    username: 'user',
    password: 'user',
    isAdmin: false
  }
}

if (process.env.NODE_ENV !== 'test') {
  router.use(asyncHandler(cognitoAuth))
} else {
  router.use(basicAuth({
    authorizer: (username, password) => {
      const user = users[username]
      return user && basicAuth.safeCompare(password, user.password)
    },
    unauthorizedResponse: (req) => {
      return {
        message: 'Unauthorized'
      }
    }
  }))
  router.use((req, res, next) => {
    // convert basic auth ({user, password}) to auth object
    const user = users[req.auth.user]
    req.auth = {
      id: req.headers['x-aktemp-user-id'] || user.id,
      isAdmin: !!user.isAdmin,
      type: 'basic'
    }
    next()
  })
}

router.use(asyncHandler(async (req, res, next) => {
  const user = await User.query()
    .withGraphFetched('providers')
    .findById(req.auth.id)

  if (!user) throw createError(404, `User (id=${req.auth.id}) not found`)

  res.locals.user = user

  next()
}))

const attachProvider = async (req, res, next) => {
  const row = await Provider.query()
    .findById(req.params.providerId)

  if (!row) throw createError(404, `Provider (id=${req.params.providerId}) not found`)

  res.locals.provider = row
  return next()
}

router.route('/')
  .get((req, res, next) => res.status(200).json(res.locals.user))

router.use('/flag-types', require('./flag-types'))
router.use('/providers', require('./providers'))
router.use('/providers/:providerId', asyncHandler(attachProvider), require('./provider'))
router.use('/files', require('./files'))
router.use('/profiles', require('./profiles'))
router.use('/series', require('./series'))
router.use('/stations', require('./stations'))

module.exports = router
