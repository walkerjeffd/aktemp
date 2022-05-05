
exports.up = knex => knex.schema.table('files', t => {
  t.text('url')
})

exports.down = knex => knex.schema.alterTable('files', t => {
  t.dropColumn('url')
})
