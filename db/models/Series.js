const Base = require('./Base')

class Series extends Base {
  static get tableName () {
    return 'series'
  }

  static get modifiers () {
    return {
      defaultSort (builder) {
        builder.orderBy(['id'])
      },
      stationOrganization (builder) {
        builder.select(
          'series.*',
          'station.code as station_code',
          'station.timezone as station_timezone',
          'station.organization_id as organization_id',
          'station.organization_code as organization_code'
        ).joinRelated('station(organizationCode)')
      },
      filename (builder) {
        builder.select(
          'series.*',
          'file.filename as file_filename'
        ).joinRelated('file')
      }
    }
  }

  static get relationMappings () {
    const File = require('./File')
    const Station = require('./Station')
    const SeriesValue = require('./SeriesValue')
    const SeriesFlag = require('./SeriesFlag')
    return {
      file: {
        relation: Base.BelongsToOneRelation,
        modelClass: File,
        join: {
          from: 'series.file_id',
          to: 'files.id'
        }
      },
      station: {
        relation: Base.BelongsToOneRelation,
        modelClass: Station,
        join: {
          from: 'series.station_id',
          to: 'stations.id'
        }
      },
      values: {
        relation: Base.HasManyRelation,
        modelClass: SeriesValue,
        join: {
          from: 'series_values.series_id',
          to: 'series.id'
        }
      },
      flags: {
        relation: Base.HasManyRelation,
        modelClass: SeriesFlag,
        join: {
          from: 'series_flags.series_id',
          to: 'series.id'
        }
      }
    }
  }
}

module.exports = Series
