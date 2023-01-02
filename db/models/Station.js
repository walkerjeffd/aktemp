const { raw } = require('objection')
const Base = require('./Base')

class Station extends Base {
  static get tableName () {
    return 'stations'
  }

  static get modifiers () {
    return {
      providerCode (builder) {
        builder
          .select('stations.*', 'organizations.code as organization_code', 'provider.code as provider_code')
          .joinRelated('provider')
          .leftJoin('organizations', 'provider.organization_id', 'organizations.id')
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
        )
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
    const Provider = require('./Provider')
    const Series = require('./Series')
    const Profile = require('./Profile')
    return {
      provider: {
        relation: Base.BelongsToOneRelation,
        modelClass: Provider,
        join: {
          from: 'stations.provider_id',
          to: 'providers.id'
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
