const Base = require('./Base')

class FlagType extends Base {
  static get tableName () {
    return 'flag_types'
  }

  $beforeInsert () { }

  $beforeUpdate () { }
}

module.exports = FlagType
