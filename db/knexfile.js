const path = require('path')
const AWS = require('aws-sdk')
const debug = require('./debug')

require('dotenv-flow').config({
  default_node_env: 'development',
  path: path.resolve(__dirname, '..'),
  silent: true
})

// override date parser to prevent fields of type `date` from being converted to JS Date()
// https://github.com/brianc/node-postgres/issues/1844
const types = require('pg').types
types.setTypeParser(types.builtins.DATE, (val) => val)

async function getConnectionFromSecret () {
  const secretsmanager = new AWS.SecretsManager({
    region: process.env.REGION
  })
  const secret = await secretsmanager.getSecretValue({
    SecretId: process.env.DB_SECRET,
    VersionStage: 'AWSCURRENT'
  }).promise()
  const parsed = JSON.parse(secret.SecretString)
  return parsed
}

async function getConnection () {
  const con = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE || 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    timezone: 'UTC'
  }
  if (!!process.env.DB_SECRET && process.env.NODE_ENV !== 'test') {
    // https://github.com/knex/knex/pull/3364
    debug(`secret: ${process.env.DB_SECRET}`)
    const secretCon = await getConnectionFromSecret()
    con.host = secretCon.host
    con.port = secretCon.port
    con.database = secretCon.dbname || 'postgres'
    con.user = secretCon.username
    con.password = secretCon.password
  }
  if (process.env.DB_PROXY_HOST) {
    debug(`proxy: ${process.env.DB_PROXY_HOST}:${process.env.DB_PROXY_PORT}`)
    con.host = process.env.DB_PROXY_HOST
    con.port = process.env.DB_PROXY_PORT
  }

  debug(`connection: host=${con.host} port=${con.port} dbname=${con.database} user=${con.user}`)
  return con
}

const config = {
  client: 'postgresql',
  connection: getConnection,
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, 'migrations')
  }
}

module.exports = {
  development: {
    ...config,
    seeds: {
      directory: path.join(__dirname, 'seeds', 'development')
    }
  },
  staging: {
    ...config,
    seeds: {
      directory: path.join(__dirname, 'seeds', 'staging')
    }
  },
  production: {
    ...config,
    seeds: {
      directory: path.join(__dirname, 'seeds', 'production')
    }
  },
  test: {
    ...config,
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_DATABASE || 'postgres',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    seeds: {
      directory: path.join(__dirname, 'seeds', 'test')
    }
  }
}
