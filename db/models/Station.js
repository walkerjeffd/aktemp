const { raw } = require('objection')
const Base = require('./Base')

class Station extends Base {
  static get tableName () {
    return 'stations'
  }

  static get modifiers () {
    return {
      organizationCode (builder) {
        builder.select('stations.*', 'organization.code as organization_code').joinRelated('organization')
      },
      seriesSummary (builder) {
        builder.select(
          'stations.*',
          Station.relatedQuery('series')
            .select(raw('count(*)::integer'))
            .as('series_count'),
          Station.relatedQuery('series')
            .min('start_datetime')
            .as('series_start_datetime'),
          Station.relatedQuery('series')
            .max('end_datetime')
            .as('series_end_datetime')
        ).debug()
      },
      profilesSummary (builder) {
        builder.select(
          'stations.*',
          Station.relatedQuery('profiles')
            .select(raw('count(*)::integer'))
            .as('profiles_count'),
          Station.relatedQuery('profiles')
            .min('date')
            .as('profiles_start_date'),
          Station.relatedQuery('profiles')
            .max('date')
            .as('profiles_end_date')
        )
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
