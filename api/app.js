const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const logger = require('morgan')
const createError = require('http-errors')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

const { databaseErrorHandler } = require('./middleware/dbError')
const { isLambda } = require('./utils')

const app = express()

if (process.env.NODE_ENV !== 'test') {
  app.use(logger('tiny'))
}
app.use(bodyParser.json())
app.use(cors())

if (isLambda()) {
  app.use(awsServerlessExpressMiddleware.eventContext())
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
