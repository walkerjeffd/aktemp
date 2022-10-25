const debug = require('debug')('aktemp-api')

const env = process.env.NODE_ENV || 'test'
debug('env:', env)
require('dotenv-flow').config({
  default_node_env: 'test',
  path: '..'
})

const config = require('aktemp-db/knexfile.js')[env]

// override database for creating and dropping test database
config.connection.testDatabase = config.connection.database
config.connection.database = 'postgres'
const con = config.connection
debug(`connection: host=${con.host} port=${con.port} dbname=${con.testDatabase} user=${con.user}`)

module.exports = config
