const Base = require('./Base')

class Download extends Base {
  static get tableName () {
    return 'downloads'
  }
}

module.exports = Download
