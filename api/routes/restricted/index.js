const express = require('express')
const asyncHandler = require('express-async-handler')
const basicAuth = require('express-basic-auth')

const { cognitoAuth } = require('../../middleware/auth')
const { attachOrganization } = require('../../controllers/organizations')

const router = express.Router()

const { isLambda } = require('../../utils')

const users = {
  admin: {
    password: 'admin',
    organizationId: 1,
    isAdmin: true
  },
  user: {
    password: 'user',
    organizationId: 1,
    isAdmin: false
  }
}

if (!isLambda()) {
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
    req.auth = Object.assign({ ...req.auth, type: 'basic' }, users[req.auth.user])
    delete req.auth.password
    next()
  })
} else {
  router.use(asyncHandler(cognitoAuth))
}

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the AKTEMP API (restricted)', user: res.locals.user })
})

router.use('/organizations/:organizationId', asyncHandler(attachOrganization), require('./organization'))

module.exports = router
