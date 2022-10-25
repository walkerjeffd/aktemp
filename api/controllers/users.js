const createError = require('http-errors')

const { User } = require('aktemp-db/models')

const attachUser = async (req, res, next) => {
  const row = await User.query()
    .withGraphFetched('organizations')
    .findById(req.params.userId)

  if (!row) throw createError(404, `User (id=${req.params.userId}) not found`)

  res.locals.user = row
  return next()
}

const getUsers = async (req, res, next) => {
  const users = await User.query()
    .withGraphFetched('organizations')
  return res.status(200).json(users)
}

module.exports = {
  attachUser,
  getUsers
}
