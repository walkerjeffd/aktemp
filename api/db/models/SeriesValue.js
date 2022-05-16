const { raw } = require('objection')
const Base = require('./Base')

class SeriesValue extends Base {
  static get tableName () {
    return 'series_values'
  }

  static get modifiers () {
    return {
      select (builder) {
        builder.select('datetime', 'value')
      },
      defaultOrderBy (builder) {
        builder.orderBy('datetime')
      },
      daily (builder) {
        builder
          .select(raw('to_char(datetime at time zone "series:station".timezone, \'YYYY-MM-DD\') as date'), raw('count(*)::integer as n'))
          .min('value as min')
          .avg('value as mean')
          .max('value as max')
          .groupBy('date')
          .orderBy('date')
          .joinRelated('series.station')
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
