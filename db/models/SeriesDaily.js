const Base = require('./Base')

class SeriesDaily extends Base {
  static get tableName () {
    return 'series_daily'
  }

  static get modifiers () {
    return {
      sort (builder) {
        builder.orderBy('date')
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
          from: 'series_daily.series_id',
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

module.exports = SeriesDaily
