const { readFileSync } = require('fs')
const Papa = require('papaparse')

const { Organization } = require('../db/models')
const { printTable } = require('./lib/utils')

function printOrganizations (rows) {
  printTable(rows, ['id', 'name'])
}

exports.findOrganizationById = async function (id) {
  return await Organization.query()
    .findById(id)
    .throwIfNotFound({
      message: `organization not found (id=${id})`
    })
}

exports.listOrganizations = async function (options) {
  const rows = await Organization.query().orderBy('id')
  printOrganizations(rows)
}

exports.importOrganizations = async function (filepath) {
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

  const rows = await Organization.query().insert(parsed.data).returning('*')
  printOrganizations(rows)
}
