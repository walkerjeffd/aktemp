const path = require('path')
require('dotenv-flow').config({
  default_node_env: 'development',
  path: __dirname,
  silent: true
})

const config = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE || 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
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
