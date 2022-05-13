const Base = require('./Base')

class Station extends Base {
  static get tableName () {
    return 'stations'
  }

  static get modifiers () {
    return {
      organizationCode (builder) {
        builder.select('stations.*', 'organization.code as organization_code').joinRelated('organization')
      }
    }
  }

  static get relationMappings () {
    const Organization = require('./Organization')
    const Series = require('./Series')
    const Profile = require('./Profile')
    return {
      organization: {
        relation: Base.BelongsToOneRelation,
        modelClass: Organization,
        join: {
          from: 'stations.organization_id',
          to: 'organizations.id'
        }
      },
      series: {
        relation: Base.HasManyRelation,
        modelClass: Series,
        join: {
          from: 'stations.id',
          to: 'series.station_id'
        }
      },
      profiles: {
        relation: Base.HasManyRelation,
        modelClass: Profile,
        join: {
          from: 'stations.id',
          to: 'profiles.station_id'
        }
      }
    }
  }
}

module.exports = Station
