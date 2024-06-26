/* eslint-env jest */
const path = require('path')
const knex = require('aktemp-db')
const { Series, Profile } = require('aktemp-db/models')
const { importStationsFromFile, findStations } = require('../lib/stations')
const { importFiles, processFile } = require('../lib/files')

const provider = { code: 'TEST', name: 'Test Provider' }

jest.setTimeout(10000)

function readJsonFile (filepath) {
  return require(path.join(__dirname, filepath))
}

describe('files', () => {
  beforeAll(async () => {
    await knex.migrate.latest()
    await knex.seed.run()
    await knex('providers').insert([provider]).returning('*')
    await importStationsFromFile(provider.code, path.join(__dirname, 'files/stations.csv'))
  })

  afterAll(async () => {
    await knex.migrate.rollback()
    await knex.destroy()
  })

  describe('series', () => {
    test('continuous', async () => {
      const options = { directory: path.join(__dirname, 'files/series/csv') }
      const filepath = path.join(__dirname, 'files/series/config-series.csv')
      const stations = await findStations('TEST')

      const importedFiles = await importFiles(provider.code, filepath, options)
      expect(importedFiles).toHaveLength(2)

      const expected = readJsonFile('files/series/json/series.json')
      expected.forEach((series, i) => {
        const station = stations.find(d => d.code === series.station_code)
        delete series.station_code
        series.station_id = station.id
        series.start_datetime = new Date(series.start_datetime)
        series.end_datetime = new Date(series.end_datetime)
        series.flags.forEach((d, j) => {
          d.start_datetime = new Date(d.start_datetime)
          d.end_datetime = new Date(d.end_datetime)
        })
        series.values.forEach((d, j) => {
          if (typeof d.temp_c === 'number') {
            d.temp_c = expect.closeTo(d.temp_c, 3)
          }
          d.datetime = new Date(d.datetime)
        })
      })

      for (const importedFile of importedFiles) {
        expect(importedFile).toHaveProperty('id')
        expect(importedFile).toHaveProperty('error', null)
        expect(importedFile).toHaveProperty('uuid')
        expect(importedFile).toHaveProperty('url')
        expect(importedFile.url).not.toBeNull()
        expect(importedFile).toHaveProperty('status', 'UPLOADED')

        const processedFile = await processFile(importedFile.id, {})
        expect(processedFile).toHaveProperty('status', 'DONE')
        expect(processedFile).toHaveProperty('error', null)

        for (let i = 0; i < processedFile.series.length; i++) {
          processedFile.series[i].values = await Series.relatedQuery('values')
            .for(processedFile.series[i].id)
            .orderBy('datetime')
          processedFile.series[i].flags = await Series.relatedQuery('flags')
            .for(processedFile.series[i].id)
            .orderBy('start_datetime')
        }
        expect(processedFile.series).toMatchObject(expected)
      }
    })

    test('discrete', async () => {
      const options = { directory: path.join(__dirname, 'files/series/csv') }
      const filepath = path.join(__dirname, 'files/series/config-discrete.csv')
      const stations = await findStations('TEST')

      const imported = await importFiles(provider.code, filepath, options)
      expect(imported).toHaveLength(1)
      const importedFile = imported[0]
      expect(importedFile).toHaveProperty('id')
      expect(importedFile).toHaveProperty('error', null)
      expect(importedFile).toHaveProperty('uuid')
      expect(importedFile).toHaveProperty('url')
      expect(importedFile.url).not.toBeNull()
      expect(importedFile).toHaveProperty('status', 'UPLOADED')

      const expected = readJsonFile('files/series/json/discrete.json')
      expected.forEach((series, i) => {
        const station = stations.find(d => d.code === series.station_code)
        delete series.station_code
        series.station_id = station.id
        series.start_datetime = new Date(series.start_datetime)
        series.end_datetime = new Date(series.end_datetime)
        series.flags.forEach((d, j) => {
          d.start_datetime = new Date(d.start_datetime)
          d.end_datetime = new Date(d.end_datetime)
        })
        series.values.forEach((d, j) => {
          if (typeof d.temp_c === 'number') {
            d.temp_c = expect.closeTo(d.temp_c, 3)
          }
          d.datetime = new Date(d.datetime)
        })
      })

      const processedFile = await processFile(importedFile.id, {})
      expect(processedFile).toHaveProperty('status', 'DONE')
      expect(processedFile).toHaveProperty('error', null)

      for (let i = 0; i < processedFile.series.length; i++) {
        processedFile.series[i].values = await Series.relatedQuery('values')
          .for(processedFile.series[i].id)
          .orderBy('datetime')
        processedFile.series[i].flags = await Series.relatedQuery('flags')
          .for(processedFile.series[i].id)
          .orderBy('start_datetime')
      }
      expect(processedFile.series).toMatchObject(expected)
    })
  })

  test('profiles', async () => {
    const options = { directory: path.join(__dirname, 'files/profiles/csv') }
    const filepath = path.join(__dirname, 'files/profiles/config.csv')
    const stations = await findStations('TEST')

    const imported = await importFiles(provider.code, filepath, options)
    expect(imported).toHaveLength(1)
    const importedFile = imported[0]
    expect(importedFile).toHaveProperty('id')
    expect(importedFile).toHaveProperty('error', null)
    expect(importedFile).toHaveProperty('uuid')
    expect(importedFile).toHaveProperty('url')
    expect(importedFile.url).not.toBeNull()
    expect(importedFile).toHaveProperty('status', 'UPLOADED')

    const expected = readJsonFile('files/profiles/json/profiles.json')
    expected.forEach((profile, i) => {
      const station = stations.find(d => d.code === profile.station_code)
      delete profile.station_code
      profile.station_id = station.id
      profile.values.forEach((d, j) => {
        if (typeof d.temp_c === 'number') {
          d.temp_c = expect.closeTo(d.temp_c, 3)
        }
        if (typeof d.depth_m === 'number') {
          d.depth_m = expect.closeTo(d.depth_m, 3)
        }
        d.datetime = new Date(d.datetime)
      })
    })

    const processedFile = await processFile(importedFile.id, {})
    expect(processedFile).toHaveProperty('status', 'DONE')
    expect(processedFile).toHaveProperty('error', null)

    for (let i = 0; i < processedFile.profiles.length; i++) {
      processedFile.profiles[i].values = await Profile.relatedQuery('values')
        .for(processedFile.profiles[i].id)
        .orderBy('datetime')
    }
    expect(processedFile.profiles).toMatchObject(expected)
  })
})
