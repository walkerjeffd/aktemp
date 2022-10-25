exports.up = (knex) => {
  return knex.schema.table('series_values', t => {
    t.dropColumn('depth_m')
  })
}

exports.down = (knex) => {
  return knex.schema.table('series_values', t => {
    t.float('depth_m')
  })
}
