const Base = require('./Base')

class User extends Base {
  static get tableName () {
    return 'users'
  }

  static get relationMappings () {
    const Station = require('./Station')
    const Organization = require('./Organization')
    return {
      stations: {
        relation: Base.HasManyRelation,
        modelClass: Station,
        join: {
          from: 'users.id',
          to: 'stations.user_id'
        }
      },
      organizations: {
        relation: Base.ManyToManyRelation,
        modelClass: Organization,
        join: {
          from: 'users.id',
          through: {
            from: 'users_organizations.user_id',
            to: 'users_organizations.organization_id'
          },
          to: 'organizations.id'
        }
      }
    }
  }
}

module.exports = User
