/* eslint-env jest */
const path = require('path')
const knex = require('aktemp-db')
const { findOrganizationByCode } = require('../lib/organizations')
const { importStationsFromFile, findStations, deleteStation } = require('../lib/stations')

describe('stations', () => {
  beforeAll(async () => {
    await knex.migrate.latest()
    await knex('organizations').insert([
      { code: 'TEST', name: 'Test Organization' }
    ]).returning('*')
  })

  afterAll(async () => {
    await knex.migrate.rollback()
    await knex.destroy()
  })

  test('stations.csv', async () => {
    const organization = await findOrganizationByCode('TEST')
    const imported = await importStationsFromFile('TEST', path.join(__dirname, 'stations/stations.csv'))
    expect(imported).toHaveLength(2)
    const station = imported[0]
    expect(station).toMatchObject({
      organization_id: organization.id,
      code: 'SITE_01',
      latitude: 65,
      longitude: -155,
      timezone: 'US/Alaska',
      description: null,
      waterbody_name: null,
      waterbody_type: null,
      placement: null,
      active: null,
      reference: null,
      private: false
    })
    const found = await findStations('TEST')
    expect(found).toHaveLength(2)
    const deleted = await deleteStation(station.id)
    expect(deleted).toMatchObject(station)
    const stationsAfterDelete = await findStations('TEST')
    expect(stationsAfterDelete).toHaveLength(1)
    for (let i = 0; i < stationsAfterDelete.length; i++) {
      await deleteStation(stationsAfterDelete[i].id)
    }
    const empty = await findStations('TEST')
    expect(empty).toHaveLength(0)
  })
})
