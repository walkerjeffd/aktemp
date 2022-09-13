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
      dates (builder) {
        builder
          .select(
            'series_flags.*',
            raw('to_char((series_flags.start_datetime at time zone "series:station".timezone), \'YYYY-MM-DD\') as start_date'),
            raw('to_char((series_flags.end_datetime at time zone "series:station".timezone), \'YYYY-MM-DD\') as end_date')
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
