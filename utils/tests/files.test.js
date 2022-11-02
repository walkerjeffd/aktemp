/* eslint-env jest */
/* eslint-disable camelcase */

const { readFileSync } = require('fs')
const path = require('path')

const { validateFileConfig } = require('../validators')
const {
  parseCsv,
  parseSeriesFile,
  parseProfilesFile
} = require('../parsers')

function readCsvFile (filepath, skipLines = 0) {
  const csv = readFileSync(path.join(__dirname, filepath), { encoding: 'utf8' }).toString()
  return parseCsv(csv, skipLines)
}

function readJsonFile (filepath) {
  return require(path.join(__dirname, filepath))
}

describe('parseSeriesFile()', () => {
  const configRows = readCsvFile('files/parseSeriesFile/config.csv').data
  const stations = [
    { id: 1, code: 'SITE_01', timezone: 'US/Alaska' },
    { id: 2, code: 'SITE_02', timezone: 'US/Alaska' }
  ]

  test.each(configRows)('$test_group:$test_name passes', ({ test_group, test_name, filename, expected, ...row }) => {
    const filepath = path.join('files/parseSeriesFile/csv', filename)
    const parsed = readCsvFile(filepath, row.file_skip)
    const config = validateFileConfig(row, parsed.meta.fields, stations)
    const series = parseSeriesFile(parsed.data, config, stations)
    expected = readJsonFile(path.join('files/parseSeriesFile/json', expected))
    expected.forEach((series, i) => {
      if (typeof series.depth_m === 'number') {
        series.depth_m = expect.closeTo(series.depth_m, 3)
      }
      series.values.forEach((d, j) => {
        if (typeof d.value === 'number') {
          d.value = expect.closeTo(d.value, 3)
        }
      })
    })
    expect(series).toMatchObject(expected)
  })

  test.each`
    filename
    ${'series-s1d1-date-missing.csv'}
    ${'series-s1d1-date-future.csv'}
    ${'series-s1d1-date-invalid.csv'}
  `('$filename throws', ({ filename }) => {
    const filepath = path.join('files/parseSeriesFile/csv', filename)
    const parsed = readCsvFile(filepath, 0)
    const config = validateFileConfig({
      file_skip: '0',
      file_type: 'SERIES',
      interval: 'CONTINUOUS',
      station_code: 'SITE_01',
      datetime_column: 'datetime_utc_iso',
      datetime_format: 'ISO',
      timezone: 'UTC',
      temperature_column: 'temp_c',
      temperature_units: 'C'
    }, parsed.meta.fields, stations)
    expect(() => { parseSeriesFile(parsed.data, config, stations) }).toThrow()
  })
})

describe('parseProfilesFile()', () => {
  const configRows = readCsvFile('files/parseProfilesFile/config.csv').data
  const stations = [
    { id: 1, code: 'SITE_01', timezone: 'US/Alaska' },
    { id: 2, code: 'SITE_02', timezone: 'US/Alaska' }
  ]

  test.each(configRows)('$test_group:$test_name passes', ({ test_group, test_name, filename, expected, ...row }) => {
    const filepath = path.join('files/parseProfilesFile/csv', filename)
    const parsed = readCsvFile(filepath, row.file_skip)
    const config = validateFileConfig(row, parsed.meta.fields, stations)
    const profiles = parseProfilesFile(parsed.data, config, stations)
    expected = readJsonFile(path.join('files/parseProfilesFile/json', expected))
    expected.forEach((profile, i) => {
      profile.values.forEach((d, j) => {
        if (typeof d.depth_m === 'number') {
          d.depth_m = expect.closeTo(d.depth_m, 3)
        }
        if (typeof d.value === 'number') {
          d.value = expect.closeTo(d.value, 3)
        }
      })
    })
    expect(profiles).toMatchObject(expected)
  })

  test.each`
    filename
    ${'profiles-s1d1-date-missing.csv'}
    ${'profiles-s1d1-date-future.csv'}
    ${'profiles-s1d1-depth-missing.csv'}
  `('$filename throws', ({ filename }) => {
    const filepath = path.join('files/parseProfilesFile/csv', filename)
    const parsed = readCsvFile(filepath, 0)
    const config = validateFileConfig({
      file_skip: '0',
      file_type: 'PROFILES',
      station_code: 'SITE_01',
      datetime_column: 'datetime_utc_iso',
      datetime_format: 'ISO',
      timezone: 'UTC',
      temperature_column: 'temp_c',
      temperature_units: 'C',
      temperature_missing: '-99.99',
      depth_column: 'depth_m',
      depth_units: 'm'
    }, parsed.meta.fields, stations)
    expect(() => { parseProfilesFile(parsed.data, config, stations) }).toThrow()
  })
})
