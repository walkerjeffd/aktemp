const Base = require('./Base')

class Provider extends Base {
  static get tableName () {
    return 'providers'
  }

  static get relationMappings () {
    const File = require('./File')
    const Station = require('./Station')
    const User = require('./User')
    return {
      users: {
        relation: Base.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'providers.id',
          through: {
            from: 'users_providers.provider_id',
            to: 'users_providers.user_id'
          },
          to: 'users.id'
        }
      },
      files: {
        relation: Base.HasManyRelation,
        modelClass: File,
        join: {
          from: 'providers.id',
          to: 'files.provider_id'
        }
      },
      stations: {
        relation: Base.HasManyRelation,
        modelClass: Station,
        join: {
          from: 'providers.id',
          to: 'stations.provider_id'
        }
      }
    }
  }
}

module.exports = Provider
