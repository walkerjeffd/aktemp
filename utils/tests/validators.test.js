/* eslint-env jest */

const path = require('path')
const { parseBoolean } = require('../parsers')
const {
  validateFileConfig,
  validateStation,
  validateSeries,
  validateProfile
} = require('../validators')
const { readCsvFile } = require('./utils')

describe('validateFileConfig()', () => {
  const fields = ['stationCode', 'datetime', 'date', 'time', 'utcOffset', 'temp_c', 'flag', 'depth_m']
  const stations = [{ code: 'TEST' }]

  let rows = readCsvFile(path.join(__dirname, './files/validateFileConfig/files.csv'))
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

describe('validateSeries()', () => {
  // const schema = {
  //   station_id: ''
  //   depth_m: ''
  //   depth_category: ''
  //   interval: ''
  //   frequency: ''
  //   accuracy: ''
  //   sop_bath: ''
  //   reviewed: ''
  // }
  const stations = [{
    id: 1
  }]

  let rows = readCsvFile(path.join(__dirname, './files/validateSeries/series.csv'))
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
      expect(() => validateSeries(row.value, stations)).not.toThrow()
    } else {
      expect(() => validateSeries(row.value, stations)).toThrow()
    }
  })
})

describe('validateProfile()', () => {
  // const schema = {
  //   station_id: ''
  //   accuracy: ''
  //   reviewed: ''
  // }
  const stations = [{
    id: 1
  }]

  let rows = readCsvFile(path.join(__dirname, './files/validateProfile/profiles.csv'))
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
      expect(() => validateProfile(row.value, stations)).not.toThrow()
    } else {
      expect(() => validateProfile(row.value, stations)).toThrow()
    }
  })
})
