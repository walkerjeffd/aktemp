const debug = require('../debug')
const { Station } = require('aktemp-db/models')
const { validateStation } = require('aktemp-utils/validators')
const { findOrganizationByCode } = require('../lib/organizations')
const { readLocalCsvFile } = require('../lib/utils')

module.exports.findStations = async function (organizationCode) {
  let query = Station.query()
  if (organizationCode) {
    const organization = await findOrganizationByCode(organizationCode)
    query = organization.$relatedQuery('stations')
  }
  return await query
    .modify('organizationCode')
    .orderBy(['organization_code', 'code'])
}

module.exports.importStationsFromFile = async function (organizationCode, filepath) {
  const organization = await findOrganizationByCode(organizationCode)
  const { data } = await readLocalCsvFile(filepath)
  const stations = data.map((d, i) => {
    try {
      return validateStation(d)
    } catch (err) {
      console.error(`Failed to validate station (row=${i})`)
      throw err
    }
  })
  return await organization.$relatedQuery('stations')
    .insert(stations)
    .returning('*')
}

module.exports.deleteStation = async function (id) {
  debug(`deleteStation: id=${id}`)
  return await Station.query().deleteById(id)
    .returning('*')
    .throwIfNotFound({
      message: `station (id=${id}) not found`,
      type: 'NotFoundError'
    })
}
