const debug = require('../debug')
const { Provider } = require('aktemp-db/models')
const { readLocalCsvFile } = require('./utils')

exports.findProviders = async function () {
  return await Provider.query().orderBy('id')
}

const createProviders = async function (items) {
  return await Provider.query()
    .insert(items)
    .returning('*')
}

exports.importProvidersFromFile = async function (filepath) {
  debug(`importProvidersFromFile: filepath=${filepath}`)
  const { data } = await readLocalCsvFile(filepath)
  return await createProviders(data)
}

exports.deleteProvider = async function (id) {
  debug(`deleteProvider: id=${id}`)
  return await Provider.query().deleteById(id)
    .returning('*')
    .throwIfNotFound({
      message: `provider (id=${id}) not found`,
      type: 'NotFoundError'
    })
}

exports.findProviderStationFromCode = async function (provider, code) {
  debug(`findProviderStationFromCode('${code}')`)
  if (!provider) {
    throw new Error('missing provider')
  }
  if (!code) return null
  const station = await provider.$relatedQuery('stations')
    .where('code', code)
    .first()
  if (!station) {
    throw new Error(`station (code='${code}') not found for provider (code='${provider.code}')`)
  }
  debug('station.id:', station.id)
  return station
}

exports.findProviderById = async function (id) {
  return await Provider.query()
    .findById(id)
    .throwIfNotFound({
      message: `provider not found (id=${id})`
    })
}

exports.findProviderByCode = async function (code) {
  if (!code) return null
  return await Provider.query()
    .where('code', code)
    .first()
    .throwIfNotFound({
      message: `provider (code='${code}') not found`
    })
}
