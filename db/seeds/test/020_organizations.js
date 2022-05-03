exports.seed = knex => knex('organizations').del()
  .then(() => knex('organizations').insert([
    { id: 'UAA', name: 'Univ. Alaska, Anchorage' },
    { id: 'NPS', name: 'National Park Service' }
  ]))
