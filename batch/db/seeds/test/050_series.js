exports.seed = knex => knex('series').del()
  .then(() => knex('series').insert([
    { station_id: 1, file_id: 1, reviewed: true }
  ]))
