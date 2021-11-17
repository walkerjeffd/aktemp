
exports.up = knex => knex.schema.createTable('organizations', t => {
  t.text('id').primary()
  t.text('name').notNullable()
  t.text('poc_name')
  t.text('poc_tel')
  t.text('poc_email')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('organizations')
