
exports.up = knex => {
  return knex.schema
    .alterTable('profile_values', (t) => {
      t.text('flag_id').nullable().alter()
    })
}

exports.down = knex => {
  return knex.schema
    .alterTable('profile_values', (t) => {
      t.text('flag_id').notNullable().alter()
    })
}
