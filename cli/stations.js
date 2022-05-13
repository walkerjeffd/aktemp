const { readFileSync } = require('fs')
const Papa = require('papaparse')

const { findOrganizationByCode } = require('./organizations')
const { Station } = require('../db/models')
const { printTable } = require('./lib/utils')

function printStations (rows) {
  printTable(rows, ['id', 'organization_code', 'code', 'latitude', 'longitude'])
}

exports.listStations = async function (options) {
  const rows = await Station.query().modify('organizationCode').orderBy(['organization_code', 'code'])

  printStations(rows)
}

exports.createStation = async function ({ organizationCode, ...body }) {
  const organization = await findOrganizationByCode(organizationCode)
  const station = await organization.$relatedQuery('stations').insert(body).returning('*')

  printStations([station])
}

exports.importStations = async function (filepath, { organizationCode }) {
  const organization = await findOrganizationByCode(organizationCode)

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

  const stations = await organization.$relatedQuery('stations')
    .insert(parsed.data)
    .returning('*')

  printStations(stations)
}
