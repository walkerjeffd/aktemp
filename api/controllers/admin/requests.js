// const { Account } = require('aktemp-db/models')

async function getRequests (req, res, next) {
  // const rows = await Account.query()
  const rows = []
  return res.status(200).json(rows)
}

module.exports = {
  getRequests
}
