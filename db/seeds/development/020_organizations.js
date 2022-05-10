exports.seed = knex => knex('organizations').del()
  .then(() => knex('organizations').insert([
    { id: 1, code: 'TEST', name: 'Test Organization' },
    { id: 2, code: 'UAA', name: 'Univ. Alaska, Anchorage' }
  ]))
