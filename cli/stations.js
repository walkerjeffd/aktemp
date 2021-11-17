const { readFileSync } = require('fs')
const Papa = require('papaparse')

const { findOrganizationById } = require('./organizations')
const { Station } = require('../db/models')
const { printTable } = require('./lib/utils')

function printStations (rows) {
  printTable(rows, ['id', 'organization_id', 'code', 'latitude', 'longitude'])
}

exports.listStations = async function (options) {
  const rows = await Station.query().orderBy(['organization_id', 'code'])

  printStations(rows)
}

exports.createStation = async function ({ organizationId, ...body }) {
  const org = await findOrganizationById(organizationId)

  const station = await org.$relatedQuery('stations').insert(body).returning('*')

  printStations([station])
}

exports.importStations = async function (filepath, { organizationId }) {
  const org = await findOrganizationById(organizationId)

  // import list of organizations from csv file
  const csv = readFileSync(filepath).toString()
  const parsed = Papa.parse(csv, {
    header: true,
    comments: '#',
    delimiter: ',',
    columns: true,
    skipEmptyLines: 'greedy'
  })

  if (parsed.errors.length > 0) {
    console.log(parsed.errors)
    throw new Error('failed to parse file')
  }

  const stations = await org.$relatedQuery('stations')
    .insert(parsed.data)
    .returning('*')

  printStations(stations)
}
