const statusTypes = require('../types/status')

exports.up = async knex => {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

  await knex.schema.createTable('requests', t => {
    t.increments('id').primary().unsigned()
    t.text('name').notNullable()
    t.text('email').notNullable()
    t.text('organization').notNullable()
    t.text('abbreviation').notNullable()
    t.text('description')
    t.boolean('pending').default(true)
    t.timestamps(true, true)
  })

  await knex.schema.createTable('organizations', t => {
    t.increments('id').primary().unsigned()
    t.text('code').unique().notNullable()
    t.text('name').notNullable()
    t.text('poc_name')
    t.text('poc_tel')
    t.text('poc_email')
    t.timestamps(true, true)
  })

  await knex.schema.createTable('users', t => {
    t.text('id').primary() // cognito sub
    t.timestamps(true, true)
  })

  await knex.schema.createTable('users_organizations', t => {
    t.text('user_id') // cognito sub
      .references('users.id')
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.integer('organization_id')
      .references('organizations.id')
      .index()
      .notNullable()
      .onDelete('CASCADE')
  })

  await knex.schema.createTable('stations', t => {
    t.increments('id').primary().unsigned()
    t.integer('organization_id')
      .references('organizations.id')
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.text('code').notNullable()
    t.text('description')
    t.float('latitude').notNullable()
    t.float('longitude').notNullable()
    t.text('placement')
    t.text('timezone').notNullable()
    t.text('waterbody_name')
    t.text('waterbody_type')
    t.boolean('active')
    t.boolean('mixed')
    t.text('reference')
    t.boolean('private').notNullable().default('false')
    t.unique(['organization_id', 'code'])
    t.timestamps(true, true)
  })

  await knex.schema.createTable('files', t => {
    t.increments('id').primary().unsigned()
    t.integer('organization_id')
      .references('organizations.id')
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.text('user_id')
      .references('users.id')
      .index()
      .onDelete('SET NULL')

    t.text('filename').notNullable()
    t.json('config').notNullable()
    t.text('type').notNullable()

    t.json('s3')
    t.text('url')
    t.uuid('uuid').defaultTo(knex.raw('uuid_generate_v4()'))
    t.enu('status', statusTypes, {
      useNative: true,
      enumName: 'status_type'
    })
    t.text('error')

    t.timestamps(true, true)
  })

  await knex.schema.createTable('flag_types', t => {
    t.text('id').primary()
    t.text('description')
  })

  await knex.schema.createTable('series', t => {
    t.increments('id').primary().unsigned()
    t.integer('file_id')
      .references('files.id')
      .unsigned()
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.integer('station_id')
      .references('stations.id')
      .unsigned()
      .index()
      .notNullable()
      .onDelete('CASCADE')

    t.float('depth_m')
    t.text('depth_category')

    t.timestamp('start_datetime').index()
    t.timestamp('end_datetime').index()

    t.text('interval')
    t.float('frequency')

    t.boolean('reviewed').notNullable().default(false)
    t.integer('accuracy')
    t.boolean('sop_bath')

    t.timestamps(true, true)
  })

  await knex.schema.createTable('series_values', t => {
    t.bigIncrements('id').primary().unsigned()
    t.integer('series_id')
      .references('series.id')
      .unsigned()
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.timestamp('datetime').notNullable()
    t.float('value').notNullable()
    t.float('depth_m')
  })

  await knex.schema.createTable('series_flags', t => {
    t.increments('id').primary().unsigned()
    t.integer('series_id')
      .references('series.id')
      .unsigned()
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.timestamp('start_datetime').notNullable()
    t.timestamp('end_datetime').notNullable()
    t.text('flag_type_id')
      .references('flag_types.id')
      .onDelete('SET NULL')
    t.text('flag_type_other')
  })

  await knex.schema.createTable('profiles', t => {
    t.increments('id').primary().unsigned()
    t.integer('file_id')
      .references('files.id')
      .unsigned()
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.integer('station_id')
      .references('stations.id')
      .unsigned()
      .index()
      .notNullable()
      .onDelete('CASCADE')

    t.date('date').index().notNullable()

    t.boolean('reviewed').notNullable().default(false)
    t.integer('accuracy')
    t.boolean('sop_bath')

    t.timestamps(true, true)
  })

  await knex.schema.createTable('profile_values', t => {
    t.bigIncrements('id').primary().unsigned()
    t.integer('profile_id')
      .references('profiles.id')
      .unsigned()
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.timestamp('datetime').notNullable()
    t.float('value').notNullable()
    t.float('depth_m').notNullable()
  })
}

exports.down = async knex => {
  await knex.schema.dropTable('profile_values')
  await knex.schema.dropTable('profiles')
  await knex.schema.dropTable('series_flags')
  await knex.schema.dropTable('series_values')
  await knex.schema.dropTable('series')
  await knex.schema.dropTable('flag_types')
  await knex.schema.dropTable('files')
  await knex.raw('DROP TYPE status_type')
  await knex.schema.dropTable('stations')
  await knex.schema.dropTable('users_organizations')
  await knex.schema.dropTable('users')
  await knex.schema.dropTable('organizations')
  await knex.schema.dropTable('requests')
  await knex.raw('DROP EXTENSION "uuid-ossp"')
}
