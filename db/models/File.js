const Base = require('./Base')

class File extends Base {
  static get tableName () {
    return 'files'
  }

  static get modifiers () {
    return {
      done (builder) {
        builder.where('status', 'DONE')
      },
      providerCode (builder) {
        builder.select('files.*', 'provider.code as provider_code').joinRelated('provider')
      }
    }
  }

  static get relationMappings () {
    const Provider = require('./Provider')
    const Series = require('./Series')
    const Profile = require('./Profile')
    return {
      provider: {
        relation: Base.BelongsToOneRelation,
        modelClass: Provider,
        join: {
          from: 'files.provider_id',
          to: 'providers.id'
        }
      },
      series: {
        relation: Base.HasManyRelation,
        modelClass: Series,
        join: {
          from: 'files.id',
          to: 'series.file_id'
        }
      },
      profiles: {
        relation: Base.HasManyRelation,
        modelClass: Profile,
        join: {
          from: 'files.id',
          to: 'profiles.file_id'
        }
      }
    }
  }
}

module.exports = File
