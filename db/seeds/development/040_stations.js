exports.seed = knex => knex('stations').del()
  .then(() => knex('stations').insert([
    { organization_id: 1, code: 'TEST_001', longitude: -152, latitude: 61, timezone: 'US/Alaska' }
  ]))
