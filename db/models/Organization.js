const Base = require('./Base')

class Organization extends Base {
  static get tableName () {
    return 'organizations'
  }

  static get relationMappings () {
    const Provider = require('./Provider')
    return {
      providers: {
        relation: Base.HasManyRelation,
        modelClass: Provider,
        join: {
          from: 'organizations.id',
          to: 'providers.organization_id'
        }
      }
    }
  }
}

module.exports = Organization
