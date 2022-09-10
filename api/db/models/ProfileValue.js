const Base = require('./Base')

class ProfileValue extends Base {
  static get tableName () {
    return 'profiles_values'
  }

  static get modifiers () {
    return {
      defaultSelect (builder) {
        builder.select('datetime', 'depth_m', 'value')
      },
      defaultOrderBy (builder) {
        builder.orderBy('datetime')
      }
    }
  }

  static get relationMappings () {
    const Profile = require('./Profile')
    return {
      series: {
        relation: Base.BelongsToOneRelation,
        modelClass: Profile,
        join: {
          from: 'profiles_values.profile_id',
          to: 'profiles.id'
        }
      }
    }
  }

  $beforeInsert () {
  }

  $beforeUpdate () {
  }
}

module.exports = ProfileValue
