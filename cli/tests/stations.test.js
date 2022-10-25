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

  test('minimal.csv', async () => {
    const organization = await findOrganizationByCode('TEST')
    const imported = await importStationsFromFile('TEST', path.join(__dirname, 'stations/minimal.csv'))
    expect(imported).toHaveLength(1)
    const station = imported[0]
    expect(station).toMatchObject({
      organization_id: organization.id,
      code: 'TEST_CLI',
      latitude: 66.5,
      longitude: -152,
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
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject(station)
    const deleted = await deleteStation(station.id)
    expect(deleted).toMatchObject(station)
    const empty = await findStations('TEST')
    expect(empty).toHaveLength(0)
  })
  test('stations.csv', async () => {
    const n = 20
    const organization = await findOrganizationByCode('TEST')
    const imported = await importStationsFromFile('TEST', path.join(__dirname, 'stations/stations.csv'))
    expect(imported).toHaveLength(n)
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
    expect(found).toHaveLength(n)
    const deleted = await deleteStation(station.id)
    expect(deleted).toMatchObject(station)
    const stationsAfterDelete = await findStations('TEST')
    expect(stationsAfterDelete).toHaveLength(n - 1)
    for (let i = 0; i < stationsAfterDelete.length; i++) {
      await deleteStation(stationsAfterDelete[i].id)
    }
    const empty = await findStations('TEST')
    expect(empty).toHaveLength(0)
  })
})
