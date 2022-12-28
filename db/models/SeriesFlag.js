const Base = require('./Base')

class SeriesFlag extends Base {
  static get tableName () {
    return 'series_flags'
  }

  static get modifiers () {
    return {
      sort (builder) {
        builder.orderBy(['series_id', 'start_datetime'])
      }
    }
  }

  static get relationMappings () {
    const Series = require('./Series')
    return {
      series: {
        relation: Base.BelongsToOneRelation,
        modelClass: Series,
        join: {
          from: 'series_flags.series_id',
          to: 'series.id'
        }
      }
    }
  }

  $beforeInsert () {
  }

  $beforeUpdate () {
  }
}

module.exports = SeriesFlag
