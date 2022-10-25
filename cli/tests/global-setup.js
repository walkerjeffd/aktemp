const debug = require('debug')('aktemp-api')
const config = require('./db-config')
const knex = require('knex')(config)

async function createDatabase () {
  debug('create db')
  try {
    await knex.raw(`DROP DATABASE IF EXISTS ${config.connection.testDatabase}`)
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
