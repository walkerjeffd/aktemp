const createError = require('http-errors')

const { Provider } = require('aktemp-db/models')

async function getProviders (req, res, next) {
  const rows = await Provider.query()
    .withGraphFetched('users')
  return res.status(200).json(rows)
}

async function postProviders (req, res, next) {
  const row = await Provider.query()
    .insert(req.body)
    .returning('*')

  if (req.body.users) {
    await row.$relatedQuery('users').relate(req.body.users)
  }
  return res.status(201).json(row)
}

const attachProvider = async (req, res, next) => {
  const row = await Provider.query()
    .withGraphFetched('users')
    .findById(req.params.providerId)

  if (!row) throw createError(404, `Provider (id=${req.params.providerId}) not found`)

  res.locals.provider = row
  return next()
}

const getProvider = async (req, res, next) => {
  return res.status(200).json(res.locals.provider)
}

const putProvider = async (req, res, next) => {
  await res.locals.provider.$query()
    .patchAndFetch(req.body)
  if (req.body.users) {
    await res.locals.provider.$relatedQuery('users').unrelate()
    await res.locals.provider.$relatedQuery('users').relate(req.body.users || [])
  }
  const row = await Provider.query()
    .withGraphFetched('users')
    .findById(req.params.providerId)
  return res.status(200).json(row)
}

const deleteProvider = async (req, res, next) => {
  const deletedCount = await res.locals.provider.$query()
    .delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete provider (id=${res.locals.provider.id})`)
  }

  return res.status(204).json()
}

module.exports = {
  getProviders,
  postProviders,
  attachProvider,
  getProvider,
  putProvider,
  deleteProvider
}
