const statusTypes = require('../types/status')

exports.up = knex => knex.schema.createTable('files', t => {
  t.increments('id').primary().unsigned()
  t.text('organization_id')
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

  t.json('s3')
  t.uuid('uuid').defaultTo(knex.raw('uuid_generate_v4()'))
  t.enu('status', statusTypes, { useNative: true, enumName: 'status_type' })
  t.text('error')

  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('files')
  .then(() => knex.raw('DROP TYPE status_type'))
