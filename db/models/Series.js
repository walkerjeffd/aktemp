const { raw } = require('objection')
const Base = require('./Base')

class Series extends Base {
  static get tableName () {
    return 'series'
  }

  static get modifiers () {
    return {
      stationOrganization (builder) {
        builder.select('series.*', 'station.code as station_code', 'station.timezone as station_timezone', 'station.organization_code as organization_code').joinRelated('station(organizationCode)')
      },
      filename (builder) {
        builder.select('series.*', 'file.filename as file_filename').joinRelated('file')
      },
      summaryByFile (builder) {
        builder
          .select('file_id', raw('count(*)::integer as series_n'))
          .min('start_datetime as start_datetime')
          .max('end_datetime as end_datetime')
          .groupBy('file_id')
      }
    }
  }

  static get relationMappings () {
    const File = require('./File')
    const Station = require('./Station')
    const SeriesValue = require('./SeriesValue')
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
      }
    }
  }
}

module.exports = Series
