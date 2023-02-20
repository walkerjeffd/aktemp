exports.up = async knex => {
  await knex.schema.table('series', t => {
    t.integer('n_values')
  })
  await knex.raw('UPDATE series SET n_values = (SELECT COUNT(*) FROM series_values WHERE series_values.series_id = series.id)')
  await knex.schema.table('profiles', t => {
    t.integer('n_values')
  })
  await knex.raw('UPDATE profiles SET n_values = (SELECT COUNT(*) FROM profile_values WHERE profile_values.profile_id = profiles.id)')
}

exports.down = async knex => {
  await knex.schema.table('series', t => {
    t.dropColumn('n_values')
  })
  await knex.schema.table('profiles', t => {
    t.dropColumn('n_values')
  })
}
