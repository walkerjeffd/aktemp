const Base = require('./Base')

class Flag extends Base {
  static get tableName () {
    return 'flags'
  }

  $beforeInsert () { }

  $beforeUpdate () { }
}

module.exports = Flag
