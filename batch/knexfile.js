const path = require('path')
const AWS = require('aws-sdk')

require('dotenv-flow').config({
  default_node_env: 'development',
  path: __dirname,
  silent: true
})

const secretsmanager = new AWS.SecretsManager({
  region: process.env.AWS_REGION
})

async function getCreds () {
  const secret = await secretsmanager.getSecretValue({
    SecretId: process.env.DB_SECRET_NAME,
    VersionStage: 'AWSCURRENT'
  }).promise()
  return JSON.parse(secret.SecretString)
}

const config = {
  client: 'postgresql',
  connection: async function () {
    if (process.env.DB_SECRET_NAME) {
      // https://github.com/knex/knex/pull/3364
      const creds = await getCreds()
      return {
        host: creds.host,
        port: creds.port,
        database: creds.dbname || 'postgres',
        user: creds.username,
        password: creds.password
      }
    }
    return {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_DATABASE || 'postgres',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, 'db', 'migrations')
  }
}

module.exports = {
  development: {
    ...config,
    seeds: {
      directory: path.join(__dirname, 'db', 'seeds', 'development')
    }
  },
  staging: {
    ...config,
    seeds: {
      directory: path.join(__dirname, 'db', 'seeds', 'staging')
    }
  },
  production: {
    ...config,
    seeds: {
      directory: path.join(__dirname, 'db', 'seeds', 'production')
    }
  }
}
