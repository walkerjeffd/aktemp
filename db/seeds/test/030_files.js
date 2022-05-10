exports.seed = knex => knex('files').del()
  .then(() => knex('files').insert([
    { organization_id: 1, filename: 'UAA_001.csv', config: '{}' }
  ]))
