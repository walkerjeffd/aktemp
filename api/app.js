const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const logger = require('morgan')
const createError = require('http-errors')
const serverlessExpressMiddleware = require('@vendia/serverless-express/src/middleware')
const jwt = require('jsonwebtoken')

const { isLambda } = require('./utils')
const { databaseErrorHandler } = require('./middleware/dbError')

const app = express()

app.use(logger('tiny'))
app.use(bodyParser.json())
app.use(cors())

if (isLambda()) {
  console.log('runtime: lambda')
  app.use(serverlessExpressMiddleware.eventContext())
} else {
  console.log('runtime: local')
  // app.use((req, res, next) => {
  //   if (req.query.dev === 'true') {
  //     req.apiGateway = {
  //       event: {
  //         requestContext: {
  //           authorizer: {
  //             claims: {
  //               sub: '123abc'
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  //   if (req.headers.authorization) {
  //     const decoded = jwt.decode(req.headers.authorization)
  //     console.log(req.auth)
  //     if (decoded['cognito:groups']) {
  //       decoded['cognito:groups'] = decoded['cognito:groups'].join(',')
  //     }
  //     req.apiGateway = {
  //       event: {
  //         requestContext: {
  //           authorizer: {
  //             claims: decoded
  //           }
  //         }
  //       }
  //     }
  //   }
  //   res.locals.isLocalDev = true
  //   next()
  // })
}

app.use('/', require('./routes'))

app.use('*', (req, res, next) => {
  next(createError(404, `Path not found (${req.originalUrl})`))
})

app.use(databaseErrorHandler)
app.use((err, req, res, next) => {
  const payload = {
    message: err.message || err.toString()
  }
  res.status(err.status || 500).json(payload)
})

module.exports = app
