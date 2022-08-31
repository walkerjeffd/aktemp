
exports.up = knex => {
  return knex.schema
    .alterTable('profiles', (t) => {
      t.boolean('reviewed').default(null).nullable().alter()
    })
}

exports.down = knex => {
  return knex.schema
    .alterTable('profiles', (t) => {
      t.boolean('reviewed').default(false).notNullable().alter()
    })
}
