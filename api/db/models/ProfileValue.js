const Base = require('./Base')

class ProfileValue extends Base {
  static get tableName () {
    return 'profile_values'
  }

  static get modifiers () {
    return {
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
          from: 'profile_values.profile_id',
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
