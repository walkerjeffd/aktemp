
exports.up = knex => knex.schema.createTable('profiles', t => {
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

  t.date('date')
  t.boolean('reviewed').default(false).notNullable()
  t.integer('accuracy')
  t.boolean('qaqc')

  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('profiles')
