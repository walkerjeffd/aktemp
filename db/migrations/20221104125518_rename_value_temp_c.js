exports.up = async (knex) => {
  await knex.schema.table('profile_values', t => {
    t.renameColumn('value', 'temp_c')
  })
  await knex.schema.table('series_values', t => {
    t.renameColumn('value', 'temp_c')
  })
}

exports.down = async (knex) => {
  await knex.schema.table('profile_values', t => {
    t.renameColumn('temp_c', 'value')
  })
  await knex.schema.table('series_values', t => {
    t.renameColumn('temp_c', 'value')
  })
}
