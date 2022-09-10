exports.seed = async knex => {
  await knex('flags').del()
  await knex('flags').insert([
    { id: 'OTHER', description: 'User-defined' },
    { id: 'BURIED', description: 'Buried logger' },
    { id: 'OOW', description: 'Out of water' }
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
    { id: 'e31729fb-09dd-40ab-bea6-af098086eb57' },
    { id: '1bd55518-0a27-4d0b-a116-f371c05bae26' }
  ]).returning('*')
  await knex('users_organizations').insert([
    { user_id: users[0].id, organization_id: organizations[0].id },
    { user_id: users[0].id, organization_id: organizations[1].id },
    { user_id: users[1].id, organization_id: organizations[0].id }
  ])
  await knex('stations').insert([
    { organization_id: organizations[0].id, code: 'TEST_001', longitude: -152, latitude: 61, timezone: 'US/Alaska', private: false }
  ])
}
