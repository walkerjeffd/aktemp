const Base = require('./Base')

class SeriesValue extends Base {
  static get tableName () {
    return 'series_values'
  }

  static get modifiers () {
    return {
      defaultOrderBy (builder) {
        builder.orderBy('datetime')
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
          from: 'series_values.series_id',
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

module.exports = SeriesValue
