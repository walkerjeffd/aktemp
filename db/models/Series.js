const Base = require('./Base')

class Series extends Base {
  static get tableName () {
    return 'series'
  }

  static get relationMappings () {
    const File = require('./File')
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
