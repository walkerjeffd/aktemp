/* eslint-env jest */

const path = require('path')
const { parseBoolean } = require('../parsers')
const {
  validateFileFields,
  validateFileConfig,
  validateStation
} = require('../validators')
const { readCsvFile } = require('./utils')

describe('validateFileFields()', () => {
  test.each`
    value
    ${undefined}
    ${null}
    ${[]}
    ${['column1']}
    ${[1]}
    ${['column1', '']}
    ${['column1', null]}
    ${['column1', 'column1']}
  `('$value fails', ({ value }) => {
    expect(() => validateFileFields(value)).toThrow()
  })
  test.each`
    value
    ${['column1', 'column2']}
    ${['column1', 'column2', 'column3', 'column4']}
  `('$value fails', ({ value }) => {
    expect(validateFileFields(value)).toMatchObject(value)
  })
})

describe('validateFileConfig()', () => {
  const fields = ['stationCode', 'datetime', 'date', 'time', 'utcOffset', 'temp_c', 'flag', 'depth_m']
  const stations = [{ code: 'TEST' }]

  let rows = readCsvFile(path.join(__dirname, './files/validateFile/files.csv'))
  rows = rows.map(({ valid, ...value }, i) => {
    valid = parseBoolean(valid, false)
    return {
      row: i + 1,
      valid,
      expected: valid ? 'passes' : 'fails',
      value
    }
  })

  test.each(rows)('row $row $expected', (row) => {
    if (row.valid) {
      delete row.valid
      expect(() => validateFileConfig(row.value, fields, stations)).not.toThrow()
    } else {
      expect(() => validateFileConfig(row.value, fields, stations)).toThrow()
    }
  })
})

describe('validateStation()', () => {
  // const schema = {
  //   code: '',
  //   description: '',
  //   latitude: '',
  //   longitude: '',
  //   timezone: '',
  //   placement: '',
  //   waterbody_name: '',
  //   waterbody_type: '',
  //   active: '',
  //   mixed: '',
  //   reference: '',
  //   private: ''
  // }
  const station = {
    code: 'SITE',
    latitude: 60,
    longitude: -150,
    timezone: 'US/Alaska'
  }

  test('code is trimmed', () => {
    const result = validateStation({
      ...station,
      code: ' ABC '
    })
    expect(result).toHaveProperty('code', 'ABC')
  })

  test('description, placement, waterbody_name, waterbody_type are undefined when empty', () => {
    const result = validateStation({
      ...station,
      description: ' ',
      placement: ' ',
      waterbody_name: ' ',
      waterbody_type: ' '
    })
    expect(result).not.toHaveProperty('description')
    expect(result).not.toHaveProperty('placement')
    expect(result).not.toHaveProperty('waterbody_name')
    expect(result).not.toHaveProperty('waterbody_type')
  })

  test.each`
    key         | value      | expected
    ${'active'} | ${'true'}  | ${true}
    ${'active'} | ${'false'} | ${false}
    ${'active'} | ${null}    | ${undefined}
    ${'active'} | ${''}      | ${undefined}
    ${'mixed'}  | ${'true'}  | ${true}
    ${'mixed'}  | ${'false'} | ${false}
    ${'mixed'}  | ${null}    | ${undefined}
    ${'mixed'}  | ${''}      | ${undefined}
  `('$key=$value is parsed as $expected', ({ key, value, expected }) => {
    const row = { ...station }
    row[key] = value
    if (expected === undefined) {
      expect(validateStation(row)).not.toHaveProperty(key)
    } else {
      expect(validateStation(row)).toHaveProperty(key, expected)
    }
  })

  test.each`
    key         | value
    ${'active'} | ${'INVALID'}
    ${'mixed'}  | ${'INVALID'}
    ${'private'}| ${'INVALID'}
  `('$key=$value throws error', ({ key, value }) => {
    const row = { ...station }
    row[key] = value
    expect(() => validateStation(row)).toThrow()
  })

  test.each`
    key         | value      | expected
    ${'private'}| ${'true'}  | ${true}
    ${'private'}| ${'false'} | ${false}
    ${'private'}| ${undefined}    | ${false}
    ${'private'}| ${null}    | ${false}
    ${'private'}| ${''}      | ${false}
  `('$key=\'$value\' is parsed as $expected', ({ key, value, expected }) => {
    const row = { ...station }
    row[key] = value
    expect(validateStation(row)).toHaveProperty(key, expected)
  })

  let rows = readCsvFile(path.join(__dirname, './files/validateStation/stations.csv'))
  rows = rows.map(({ valid, ...value }, i) => {
    valid = parseBoolean(valid, false)
    return {
      row: i + 1,
      valid,
      expected: valid ? 'passes' : 'fails',
      value
    }
  })

  test.each(rows)('row $row $expected', (row) => {
    if (row.valid) {
      delete row.valid
      expect(() => validateStation(row.value)).not.toThrow()
    } else {
      expect(() => validateStation(row.value)).toThrow()
    }
  })
})
