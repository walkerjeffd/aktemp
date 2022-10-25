const env = process.env.NODE_ENV || 'development'
const debug = require('./debug')
debug(`env: ${env}`)

const config = require('./knexfile.js')[env]

module.exports = require('knex')(config)
