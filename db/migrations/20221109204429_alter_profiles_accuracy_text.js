exports.up = async (knex) => {
  await knex.schema.table('profiles', t => {
    t.text('accuracy').alter()
  })
}

exports.down = async (knex) => {
  await knex.schema.table('profiles', t => {
    t.integer('accuracy').alter()
  })
}
