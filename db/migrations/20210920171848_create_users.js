
exports.up = knex => knex.schema.createTable('users', t => {
  t.text('id').primary() // cognito sub
  t.text('organization_id')
    .references('organizations.id')
    .index()
    .notNullable()
    .onDelete('SET NULL')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('users')
