const Base = require('./Base')

class User extends Base {
  static get tableName () {
    return 'users'
  }

  static get relationMappings () {
    const Station = require('./Station')
    const provider = require('./Provider')
    return {
      stations: {
        relation: Base.HasManyRelation,
        modelClass: Station,
        join: {
          from: 'users.id',
          to: 'stations.user_id'
        }
      },
      providers: {
        relation: Base.ManyToManyRelation,
        modelClass: provider,
        join: {
          from: 'users.id',
          through: {
            from: 'users_providers.user_id',
            to: 'users_providers.provider_id'
          },
          to: 'providers.id'
        }
      }
    }
  }
}

module.exports = User
