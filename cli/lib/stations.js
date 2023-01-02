const debug = require('../debug')
const { Station } = require('aktemp-db/models')
const { validateStation } = require('aktemp-utils/validators')
const { findProviderByCode } = require('../lib/providers')
const { readLocalCsvFile } = require('../lib/utils')

module.exports.findStations = async function (providerCode) {
  let query = Station.query()
  if (providerCode) {
    const provider = await findProviderByCode(providerCode)
    query = provider.$relatedQuery('stations')
  }
  return await query
    .modify('providerCode')
    .orderBy(['provider_code', 'code'])
}

module.exports.importStationsFromFile = async function (providerCode, filepath) {
  const provider = await findProviderByCode(providerCode)
  const { data } = await readLocalCsvFile(filepath)
  const stations = data.map((d, i) => {
    try {
      return validateStation(d)
    } catch (err) {
      console.error(`Failed to validate station (row=${i})`)
      throw err
    }
  })
  return await provider.$relatedQuery('stations')
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
