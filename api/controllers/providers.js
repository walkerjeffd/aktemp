const createError = require('http-errors')

const { Provider } = require('aktemp-db/models')

const attachProvider = async (req, res, next) => {
  const row = await Provider.query()
    .withGraphFetched('users')
    .findById(req.params.providerId)

  if (!row) throw createError(404, `Provider (id=${req.params.providerId}) not found`)

  res.locals.provider = row
  return next()
}

const getProviders = async (req, res, next) => {
  const providers = await Provider.query()
    .orderBy('code')
  return res.status(200).json(providers)
}

const getUserProviders = async (req, res, next) => {
  const providers = !res.locals.user || !res.locals.user.providers
    ? []
    : res.locals.user.providers
  return res.status(200).json(providers)
}

module.exports = {
  attachProvider,
  getProviders,
  getUserProviders
}
