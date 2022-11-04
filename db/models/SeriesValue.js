const { raw } = require('objection')
const Base = require('./Base')

class SeriesValue extends Base {
  static get tableName () {
    return 'series_values'
  }

  static get modifiers () {
    return {
      defaultSelect (builder) {
        builder.select('datetime', 'temp_c')
      },
      defaultSort (builder) {
        builder.orderBy('datetime')
      },
      daily (builder) {
        builder
          .select(
            raw('to_char((datetime at time zone "series:station".timezone), \'YYYY-MM-DD\') as date'),
            raw('count(*)::integer as n')
          )
          .min('temp_c as min_temp_c')
          .avg('temp_c as mean_temp_c')
          .max('temp_c as max_temp_c')
          .groupBy(['series_id', 'date'])
          .orderBy(['series_id', 'date'])
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
