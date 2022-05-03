exports.seed = knex => knex('files').del()
  .then(() => knex('files').insert([
    { organization_id: 'UAA', filename: 'UAA_001.csv', config: '{}' }
  ]))
