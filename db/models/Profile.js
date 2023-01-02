const { raw } = require('objection')
const Base = require('./Base')

class Profile extends Base {
  static get tableName () {
    return 'profiles'
  }

  static get modifiers () {
    return {
      stationProvider (builder) {
        builder.select(
          'profiles.*',
          'station.code as station_code',
          'station.timezone as station_timezone',
          'station.provider_id as provider_id',
          'station.provider_code as provider_code'
        ).joinRelated('station(providerCode)')
      },
      filename (builder) {
        builder.select(
          'profiles.*',
          'file.filename as file_filename'
        ).joinRelated('file')
      },
      valuesSummary (builder) {
        builder.select(
          'profiles.*',
          Profile.relatedQuery('values')
            .select(raw('count(*)::integer'))
            .as('values_count')
        )
      }
    }
  }

  static get relationMappings () {
    const File = require('./File')
    const Station = require('./Station')
    const ProfileValue = require('./ProfileValue')
    return {
      file: {
        relation: Base.BelongsToOneRelation,
        modelClass: File,
        join: {
          from: 'profiles.file_id',
          to: 'files.id'
        }
      },
      station: {
        relation: Base.BelongsToOneRelation,
        modelClass: Station,
        join: {
          from: 'profiles.station_id',
          to: 'stations.id'
        }
      },
      values: {
        relation: Base.HasManyRelation,
        modelClass: ProfileValue,
        join: {
          from: 'profile_values.profile_id',
          to: 'profiles.id'
        }
      }
    }
  }
}

module.exports = Profile
