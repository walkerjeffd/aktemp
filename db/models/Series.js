const Base = require('./Base')

class Series extends Base {
  static get tableName () {
    return 'series'
  }

  static get modifiers () {
    return {
      sort (builder) {
        builder.orderBy(['id'])
      },
      stationProvider (builder) {
        builder.select(
          'series.*',
          'station.code as station_code',
          'station.timezone as station_timezone',
          'station.provider_id as provider_id',
          'station.provider_code as provider_code'
        ).joinRelated('station(providerCode)')
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
    const SeriesDaily = require('./SeriesDaily')
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
      daily: {
        relation: Base.HasManyRelation,
        modelClass: SeriesDaily,
        join: {
          from: 'series_daily.series_id',
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
