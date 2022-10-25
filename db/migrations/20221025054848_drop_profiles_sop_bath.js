exports.up = (knex) => {
  return knex.schema.table('profiles', t => {
    t.dropColumn('sop_bath')
  })
}

exports.down = (knex) => {
  return knex.schema.table('profiles', t => {
    t.boolean('sop_bath')
  })
}
