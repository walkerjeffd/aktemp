/* eslint-env jest */
const path = require('path')
const knex = require('aktemp-db')
const { Series } = require('aktemp-db/models')
const { importStationsFromFile, findStations } = require('../lib/stations')
const { importFiles, processFile } = require('../lib/files')

const organization = { code: 'TEST', name: 'Test Organization' }

jest.setTimeout(10000)

describe('series', () => {
  beforeAll(async () => {
    await knex.migrate.latest()
    await knex('organizations').insert([organization]).returning('*')
    await importStationsFromFile(organization.code, path.join(__dirname, 'series/stations.csv'))
  })

  afterAll(async () => {
    await knex.migrate.rollback()
    await knex.destroy()
  })

  test('minimal.csv', async () => {
    const filepath = path.join(__dirname, 'series/minimal.csv')
    const stations = await findStations(organization.code)
    const station = stations[0]
    const options = { directory: path.join(__dirname, 'series/files') }
    const imported = await importFiles(organization.code, filepath, options)
    expect(imported).toHaveLength(1)
    const importedFile = imported[0]
    expect(importedFile).toHaveProperty('id')
    expect(importedFile).toHaveProperty('error', null)
    expect(importedFile).toHaveProperty('uuid')
    expect(importedFile).toHaveProperty('url')
    expect(importedFile.url).not.toBeNull()
    expect(importedFile).toHaveProperty('status', 'UPLOADED')

    const processed = await processFile(importedFile.id, {})
    expect(processed).toHaveProperty('status', 'DONE')
    expect(processed).toHaveProperty('error', null)
    expect(processed.series).toHaveLength(1)
    expect(processed.profiles).toHaveLength(0)

    const series = processed.series[0]
    expect(series).toMatchObject({
      file_id: processed.id,
      station_id: station.id,
      interval: 'CONTINUOUS',
      start_datetime: new Date('2020-09-25T09:00:00.000Z'),
      end_datetime: new Date('2021-10-04T16:30:00.000Z'),
      frequency: 30,
      depth_category: null,
      depth_m: null,
      accuracy: null,
      sop_bath: null,
      reviewed: false
    })

    const values = await Series.relatedQuery('values')
      .for(series.id)
      .orderBy('datetime')
    expect(values).toHaveLength(17968)
    expect(values[0]).toMatchObject({
      series_id: series.id,
      datetime: new Date('2020-09-25T09:00:00.000Z'),
      value: 8.20
    })
    expect(values[values.length - 1]).toMatchObject({
      series_id: series.id,
      datetime: new Date('2021-10-04T16:30:00.000Z'),
      value: 2.53
    })
  })
})
