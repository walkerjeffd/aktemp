/* eslint-env jest */
/* eslint-disable camelcase */

const { readFileSync } = require('fs')
const path = require('path')

const { validateFileConfig } = require('../validators')
const {
  parseCsv,
  parseSeriesFile
} = require('../parsers')

function readCsvFile (filepath) {
  const csv = readFileSync(path.join(__dirname, filepath), { encoding: 'utf8' }).toString()
  return parseCsv(csv)
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
    const parsed = readCsvFile(filepath)
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
})
