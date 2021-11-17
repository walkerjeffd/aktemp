
exports.up = knex => knex.schema.createTable('stations', t => {
  t.increments('id').primary().unsigned()
  t.text('organization_id')
    .references('organizations.id')
    .index()
    .notNullable()
    .onDelete('CASCADE')
  t.text('code').notNullable()
  t.float('latitude').notNullable()
  t.float('longitude').notNullable()
  t.text('placement')
  t.text('timezone').notNullable()
  t.text('waterbody_name')
  t.text('waterbody_type')
  t.boolean('active')
  t.boolean('mixed')
  t.text('reference')

  t.unique(['organization_id', 'code'])
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('stations')
