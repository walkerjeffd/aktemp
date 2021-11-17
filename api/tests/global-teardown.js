const env = process.env.NODE_ENV || 'test'
const config = require('../db/knexfile.js')[env]

const knex = require('knex')(config)

async function deleteDatabase () {
  try {
    await knex.raw(`DROP DATABASE IF EXISTS ${config.connection.testDatabase}`)
  } catch (err) {
    console.log(err)
  } finally {
    await knex.destroy()
  }
}

module.exports = async () => {
  await deleteDatabase()
}
