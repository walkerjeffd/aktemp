
exports.up = knex => knex.schema.createTable('users_organizations', t => {
  t.text('user_id') // cognito sub
    .references('users.id')
    .index()
    .notNullable()
    .onDelete('CASCADE')
  t.text('organization_id')
    .references('organizations.id')
    .index()
    .notNullable()
    .onDelete('CASCADE')
})

exports.down = knex => knex.schema.dropTable('users_organizations')
