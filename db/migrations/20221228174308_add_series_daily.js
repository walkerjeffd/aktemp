exports.up = (knex) => {
  return knex.schema.createTable('series_daily', t => {
    t.bigIncrements('id').primary().unsigned()
    t.integer('series_id')
      .references('series.id')
      .unsigned()
      .index()
      .notNullable()
      .onDelete('CASCADE')
    t.date('date').notNullable()
    t.integer('n_values')
    t.float('min_temp_c')
    t.float('mean_temp_c')
    t.float('max_temp_c')
  })
}

exports.down = (knex) => {
  return knex.schema.dropTable('series_daily')
}
