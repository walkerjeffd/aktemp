const Base = require('./Base')

class Profile extends Base {
  static get tableName () {
    return 'profiles'
  }

  static get relationMappings () {
    const File = require('./File')
    const ProfileValue = require('./ProfileValue')
    return {
      file: {
        relation: Base.BelongsToOneRelation,
        modelClass: File,
        join: {
          from: 'profiles.file_id',
          to: 'files.id'
        }
      },
      values: {
        relation: Base.HasManyRelation,
        modelClass: ProfileValue,
        join: {
          from: 'profile_values.profile_id',
          to: 'profiles.id'
        }
      }
    }
  }
}

module.exports = Profile
