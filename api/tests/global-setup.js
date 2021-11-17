const env = process.env.NODE_ENV || 'test'
const config = require('../db/knexfile.js')[env]

// override database for creating and dropping test database
config.connection.testDatabase = config.connection.database
config.connection.database = 'postgres'

const knex = require('knex')(config)

async function createDatabase () {
  try {
    await knex.raw(`CREATE DATABASE ${config.connection.testDatabase}`)
  } catch (err) {
    console.log(err)
  } finally {
    await knex.destroy()
  }
}

module.exports = async () => {
  await createDatabase()
}
