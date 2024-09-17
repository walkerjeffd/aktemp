exports.up = async knex => {
  await knex.schema.table('stations', t => {
    t.text('photo_url')
  })
}

exports.down = async knex => {
  await knex.schema.table('stations', t => {
    t.dropColumn('photo_url')
  })
}
