const { raw } = require('objection')
const Base = require('./Base')

class SeriesFlag extends Base {
  static get tableName () {
    return 'series_flags'
  }

  static get modifiers () {
    return {
      defaultSort (builder) {
        builder.orderBy('start_datetime')
      },
      daily (builder) {
        builder
          .select(
            'id',
            raw('to_char((start_datetime at time zone "series:station".timezone), \'YYYY-MM-DD\') as start_date'),
            raw('to_char((end_datetime at time zone "series:station".timezone), \'YYYY-MM-DD\') as end_date'),
            'flag_type_id',
            'flag_type_other'
          )
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
