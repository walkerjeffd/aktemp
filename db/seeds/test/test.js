exports.seed = async knex => {
  await knex('flag_types').del()
  await knex('stations').del()
  await knex('files').del()
  await knex('users').del()
  await knex('organizations').del()

  await knex('flag_types').insert([
    { id: 'OTHER', description: 'Other' },
    { id: 'BURIED', description: 'Buried logger' },
    { id: 'OOW', description: 'Out of water' }
  ])

  const organizations = await knex('organizations').insert([
    { code: 'UAA', name: 'Univ. Alaska, Anchorage' },
    { code: 'NPS', name: 'National Park Service' }
  ]).returning('*')

  const users = await knex('users').insert([
    { id: 'abc-123' }
  ]).returning('*')

  await knex('users_organizations').insert([
    { user_id: users[0].id, organization_id: organizations[0].id }
  ])

  const stations = await knex('stations').insert([
    {
      organization_id: organizations[0].id,
      code: 'UAA_001',
      longitude: 44,
      latitude: -70,
      timezone: 'US/Alaska',
      private: false
    }
  ]).returning('*')

  const files = await knex('files').insert([
    {
      organization_id: organizations[0].id,
      filename: 'UAA_001.csv',
      type: 'SERIES',
      config: '{}'
    }
  ]).returning('*')

  const series = await knex('series').insert([
    {
      station_id: stations[0].id,
      file_id: files[0].id,
      reviewed: true
    }
  ]).returning('*')

  await knex('series_values').insert([
    { series_id: series[0].id, datetime: '2022-04-15T12:00:00Z', value: 1.5 },
    { series_id: series[0].id, datetime: '2022-04-15T13:00:00Z', value: 2.5 },
    { series_id: series[0].id, datetime: '2022-04-15T14:00:00Z', value: 3.5 }
  ])
}