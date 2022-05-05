
exports.up = knex => knex.schema.createTable('users', t => {
  t.text('id').primary() // cognito sub
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('users')
