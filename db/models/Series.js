const Base = require('./Base')

class Series extends Base {
  static get tableName () {
    return 'series'
  }

  static get modifiers () {
    return {
      stationOrganizationCodes (builder) {
        builder.select('series.*', 'station.code as station_code', 'station:organization.id as organization_code').joinRelated('[station.organization]')
      },
      filename (builder) {
        builder.select('series.*', 'file.filename as filename').joinRelated('file')
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
