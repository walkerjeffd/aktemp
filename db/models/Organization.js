const Base = require('./Base')

class Organization extends Base {
  static get tableName () {
    return 'organizations'
  }

  static get relationMappings () {
    const File = require('./File')
    const Station = require('./Station')
    const User = require('./User')
    return {
      users: {
        relation: Base.HasManyRelation,
        modelClass: User,
        join: {
          from: 'organizations.id',
          to: 'users.organization_id'
        }
      },
      files: {
        relation: Base.HasManyRelation,
        modelClass: File,
        join: {
          from: 'organizations.id',
          to: 'files.organization_id'
        }
      },
      stations: {
        relation: Base.HasManyRelation,
        modelClass: Station,
        join: {
          from: 'organizations.id',
          to: 'stations.organization_id'
        }
      }
    }
  }
}

module.exports = Organization