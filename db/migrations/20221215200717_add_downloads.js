exports.up = (knex) => {
  return knex.schema.createTable('downloads', t => {
    t.increments('id').primary().unsigned()

    t.json('config').notNullable()
    t.json('s3')
    t.text('url')
    t.float('size')
    t.uuid('uuid').defaultTo(knex.raw('uuid_generate_v4()'))
    t.enu('status', null, {
      useNative: true,
      existingType: true,
      enumName: 'status_type'
    })
    t.text('error')

    t.timestamps(true, true)
  })
}

exports.down = (knex) => {
  return knex.schema.dropTable('downloads')
}
