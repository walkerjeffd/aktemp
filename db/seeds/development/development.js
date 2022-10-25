exports.seed = async knex => {
  await knex('flag_types').del()
  await knex('flag_types').insert([
    { id: 'OTHER', description: 'Other' },
    { id: 'BURIED', description: 'Buried logger' },
    { id: 'OOW', description: 'Out of water' },
    { id: 'ERROR', description: 'Logger error' }
  ])

  await knex('stations').del()
  await knex('users_organizations').del()
  await knex('users').del()
  await knex('organizations').del()

  const organizations = await knex('organizations').insert([
    { code: 'TEST', name: 'Test' },
    { code: 'UAA', name: 'Univ. Alaska, Anchorage' }
  ]).returning('*')
  const users = await knex('users').insert([
    { id: 'e31729fb-09dd-40ab-bea6-af098086eb57' }
  ]).returning('*')
  await knex('users_organizations').insert([
    { user_id: users[0].id, organization_id: organizations[0].id },
    { user_id: users[0].id, organization_id: organizations[1].id }
  ])
  await knex('stations').insert([
    { organization_id: organizations[0].id, code: 'TEST_001', longitude: -152, latitude: 61, timezone: 'US/Alaska', private: false }
  ])
}
