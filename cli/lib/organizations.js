const debug = require('../debug')
const { Organization } = require('aktemp-db/models')
const { readLocalCsvFile } = require('../lib/utils')

exports.findOrganizations = async function () {
  return await Organization.query().orderBy('id')
}

const createOrganizations = async function (items) {
  return await Organization.query()
    .insert(items)
    .returning('*')
}

exports.importOrganizationsFromFile = async function (filepath) {
  debug(`importOrganizationsFromFile: filepath=${filepath}`)
  const { data } = await readLocalCsvFile(filepath)
  return await createOrganizations(data)
}

exports.deleteOrganization = async function (id) {
  debug(`deleteOrganization: id=${id}`)
  return await Organization.query().deleteById(id)
    .returning('*')
    .throwIfNotFound({
      message: `organization (id=${id}) not found`,
      type: 'NotFoundError'
    })
}

exports.findOrganizationStationFromCode = async function (organization, code) {
  debug(`findOrganizationStationFromCode('${code}')`)
  if (!organization) {
    throw new Error('missing organization')
  }
  if (!code) return null
  const station = await organization.$relatedQuery('stations')
    .where('code', code)
    .first()
  if (!station) {
    throw new Error(`station (code='${code}') not found for organization (code='${organization.code}')`)
  }
  debug('station.id:', station.id)
  return station
}

exports.findOrganizationById = async function (id) {
  return await Organization.query()
    .findById(id)
    .throwIfNotFound({
      message: `organization not found (id=${id})`
    })
}

exports.findOrganizationByCode = async function (code) {
  if (!code) return null
  return await Organization.query()
    .where('code', code)
    .first()
    .throwIfNotFound({
      message: `organization (code='${code}') not found`
    })
}
