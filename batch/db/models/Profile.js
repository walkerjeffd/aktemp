const Base = require('./Base')

class Profile extends Base {
  static get tableName () {
    return 'profiles'
  }

  static get modifiers () {
    return {
      stationOrganization (builder) {
        builder.select('profiles.*', 'station.code as station_code', 'station.timezone as station_timezone', 'station.organization_code as organization_code').joinRelated('station(organizationCode)')
      },
      filename (builder) {
        builder.select('profiles.*', 'file.filename as file_filename').joinRelated('file')
      }
    }
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
