exports.seed = knex => knex('stations').del()
  .then(() => knex('stations').insert([
    { organization_id: 'UAA', code: 'UAA_001', longitude: 44, latitude: -70, timezone: 'US/Alaska' }
  ]))
