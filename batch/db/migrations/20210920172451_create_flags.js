
exports.up = knex => knex.schema.createTable('flags', t => {
  t.text('id').primary()
  t.text('description')
})

exports.down = knex => knex.schema.dropTable('flags')
