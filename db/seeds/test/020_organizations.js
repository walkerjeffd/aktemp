exports.seed = knex => knex('organizations').del()
  .then(() => knex('organizations').insert([
    { id: 1, code: 'UAA', name: 'Univ. Alaska, Anchorage' },
    { id: 2, code: 'NPS', name: 'National Park Service' }
  ]))
