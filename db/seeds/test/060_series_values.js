exports.seed = knex => knex('series_values').del()
  .then(() => knex('series_values').insert([
    { series_id: 1, datetime: '2022-04-15T12:00:00Z', value: 1.5 },
    { series_id: 1, datetime: '2022-04-15T13:00:00Z', value: 2.5 },
    { series_id: 1, datetime: '2022-04-15T14:00:00Z', value: 3.5 }
  ]))
