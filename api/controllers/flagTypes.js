const { FlagType } = require('aktemp-db/models')

async function getFlagTypes (req, res, next) {
  const rows = await FlagType.query()
  return res.status(200).json(rows)
}

module.exports = {
  getFlagTypes
}
