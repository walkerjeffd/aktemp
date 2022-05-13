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
      organizationCode (builder) {
        builder.select('files.*', 'organization.code as organization_code').joinRelated('organization')
      },
      seriesProfilesSummary (builder) {
        builder.select(
          'files.*',
          File.relatedQuery('series(summaryByFile)')
        )
      }
    }
  }

  static get relationMappings () {
    const Organization = require('./Organization')
    const Series = require('./Series')
    const Profile = require('./Profile')
    return {
      organization: {
        relation: Base.BelongsToOneRelation,
        modelClass: Organization,
        join: {
          from: 'files.organization_id',
          to: 'organizations.id'
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
          to: 'profile.file_id'
        }
      }
    }
  }
}

module.exports = File
