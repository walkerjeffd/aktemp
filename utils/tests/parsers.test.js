/* eslint-env jest */

const { readFileSync } = require('fs')
const path = require('path')
const {
  parseUtcOffset,
  parseTimestamp,
  parseTemperature,
  parseDepth,
  parseFlag,
  parseBoolean,
  parseCsv,
  parseProfilesFile
} = require('../parsers')
const {
  validateFileConfig
} = require('../validators')

describe('parseUtcOffset()', () => {
  test.each`
    value      | expected
    ${'0'}     | ${'UTC'}
    ${'-8'}    | ${'UTC-8'}
    ${'-9'}    | ${'UTC-9'}
    ${'UTC-8'} | ${'UTC-8'}
    ${'UTC-9'} | ${'UTC-9'}
  `('\'$value\' is \'$expected\'', ({ value, expected }) => {
    expect(parseUtcOffset({ value }, 'value')).toEqual(expected)
  })
  test.each`
    value               | column
    ${{ }}              | ${'x'}
    ${{ x: '' }}        | ${'x'}
    ${{ x: 'INVALID' }} | ${'x'}
    ${{ x: '-8' }}      | ${'y'}
  `('\'$value\', column=\'$column\' throws', ({ value, column }) => {
    expect(() => parseUtcOffset(value, column)).toThrow()
  })
})

describe('parseTimestamp()', () => {
  test.each`
    value                                  | dCol   | tCol    | format             | timezone   | timezoneColumn | expected
    ${{ x: '2022-01-02T00:00:00.000Z' }}   | ${'x'} | ${null} | ${'ISO'}           | ${''}      | ${''}   | ${'2022-01-02T00:00:00.000Z'}
    ${{ x: '2022-01-02T00:00:00.000-08' }} | ${'x'} | ${null} | ${'ISO'}           | ${''}      | ${''}   | ${'2022-01-02T08:00:00.000Z'}
    ${{ x: '2022-01-02T00:00:00.000Z' }}   | ${'x'} | ${null} | ${'ISO'}           | ${'UTC'}   | ${''}   | ${'2022-01-02T00:00:00.000Z'}
    ${{ x: '2022-01-02T00:00:00.000' }}    | ${'x'} | ${null} | ${'ISO'}           | ${'UTC'}   | ${''}   | ${'2022-01-02T00:00:00.000Z'}
    ${{ x: '2022-01-02T00:00:00.000Z' }}   | ${'x'} | ${null} | ${'ISO'}           | ${'UTC-8'} | ${''}   | ${'2022-01-02T08:00:00.000Z'}
    ${{ x: '2022-01-02T00:00' }}           | ${'x'} | ${null} | ${'ISO'}           | ${'UTC'}   | ${''}   | ${'2022-01-02T00:00:00.000Z'}
    ${{ x: '2022-01-02T00:00' }}           | ${'x'} | ${null} | ${'ISO'}           | ${'UTC-8'} | ${''}   | ${'2022-01-02T08:00:00.000Z'}
    ${{ x: '1/2/2022 00:00' }}             | ${'x'} | ${null} | ${'M/d/yy H:mm'}   | ${'UTC-8'} | ${''}   | ${'2022-01-02T08:00:00.000Z'}
    ${{ x: '1/2/2022 00:00' }}             | ${'x'} | ${null} | ${'M/d/yy H:mm'}   | ${'UTC-8'} | ${''}   | ${'2022-01-02T08:00:00.000Z'}
    ${{ x: '1/2/2022', y: '00:00' }}       | ${'x'} | ${'y'}  | ${'M/d/yy H:mm'}   | ${'UTC-8'} | ${''}   | ${'2022-01-02T08:00:00.000Z'}
    ${{ x: '1/2/2022 00:00' }}             | ${'x'} | ${null} | ${'M/d/yy H:mm'}   | ${''}      | ${''}   | ${'2022-01-02T00:00:00.000Z'}
    ${{ x: '1/2/2022 1:00 AM' }}           | ${'x'} | ${null} | ${'M/d/yy h:mm a'} | ${'UTC-8'} | ${''}   | ${'2022-01-02T09:00:00.000Z'}
    ${{ x: '1/2/2022 1:00 PM' }}           | ${'x'} | ${null} | ${'M/d/yy h:mm a'} | ${'UTC-8'} | ${''}   | ${'2022-01-02T21:00:00.000Z'}
    ${{ x: '1/2/2022 00:00', tz: '-8' }}   | ${'x'} | ${null} | ${'M/d/yy H:mm'}   | ${''}      | ${'tz'} | ${'2022-01-02T08:00:00.000Z'}
  `('[\'$value\', $dCol, $tCol, $format, $timezone, $timezoneColumn ] is $expected', ({ value, dCol, tCol, format, timezone, timezoneColumn, expected }) => {
    const config = {
      datetime_column: dCol,
      time_column: tCol,
      datetime_format: format,
      timezone,
      timezone_column: timezoneColumn
    }
    expect(parseTimestamp(value, config)).toEqual(expected)
  })
})

describe('parseTemperature()', () => {
  const config = {
    temperature_column: 'value',
    temperature_units: 'C',
    temperature_missing: ['-9999', 'NA']
  }
  test.each`
    value      | expected
    ${''}      | ${null}
    ${' '}     | ${null}
    ${'NA'}    | ${null}
    ${'-9999'} | ${null}
    ${'f10'}   | ${null}
  `('\'$value\' is null', ({ value, expected }) => {
    expect(parseTemperature({ value }, config)).toEqual(expected)
  })
  test.each`
    value        | expected
    ${'0'}       | ${0}
    ${'0.0'}     | ${0}
    ${'-0'}      | ${-0}
    ${'1.5e-2'}  | ${0.015}
    ${'1.5'}     | ${1.5}
    ${'-1'}      | ${-1}
    ${'-1.5'}    | ${-1.5}
    ${'10f'}     | ${10}
  `('\'$value\' passes', ({ value, expected }) => {
    expect(parseTemperature({ value }, config)).toEqual(expected)
  })
  test.each`
    value
    ${'32'}
    ${'90.5'}
  `('\'$value\' F to C', ({ value }) => {
    const config = {
      temperature_column: 'value',
      temperature_units: 'F',
      temperature_missing: []
    }
    expect(parseTemperature({ value }, config)).toBeCloseTo((parseFloat(value) - 32) * 5 / 9)
  })
})

describe('parseFlag()', () => {
  test.each`
    row           | column | expected
    ${{ x: '' }}    | ${'x'} | ${null}
    ${{ x: ' ' }}   | ${'x'} | ${null}
    ${{ x: '-99' }} | ${'x'} | ${'-99'}
    ${{ x: 'NA' }}  | ${'x'} | ${'NA'}
    ${{ x: 'NA' }}  | ${'y'} | ${undefined}
  `('\'$row\', column=\'$column\' is $expected', ({ row, column, expected }) => {
    expect(parseFlag(row, { flag_column: column })).toEqual(expected)
  })
})

describe('parseDepth()', () => {
  const config = {
    file_type: 'SERIES',
    depth_column: 'value',
    depth_units: 'm'
  }
  test.each`
    value      | expected
    ${'0'}     | ${0}
    ${'1'}     | ${1}
    ${'1.5'}   | ${1.5}
  `('\'$value\' passes', ({ value, expected }) => {
    expect(parseDepth({ value }, config)).toBeCloseTo(expected)
  })
  test.each`
    value
    ${''}
    ${' '}
    ${'NA'}
    ${'f10'}
  `('\'$value\' to be null (file_type=\'SERIES\')', ({ value }) => {
    expect(parseDepth({ value }, config)).toBeNull()
  })
  test.each`
    value      | expected
    ${''}      | ${null}
    ${' '}     | ${null}
    ${'NA'}    | ${null}
    ${'f10'}   | ${null}
  `('\'$value\' throws (file_type=\'PROFILES\')', ({ value, expected }) => {
    expect(() => parseDepth({ value }, { ...config, file_type: 'PROFILES' })).toThrow()
  })
  test.each`
    value      | units   | expected
    ${'1'}     | ${'m'}  | ${1}
    ${'1'}     | ${'ft'} | ${0.3048}
    ${'1'}     | ${'in'} | ${0.0254}
    ${'1'}     | ${'cm'} | ${0.01}
  `('[\'$value\', $units] passes ', ({ value, units, expected }) => {
    const config = {
      depth_column: 'value',
      depth_units: units
    }
    expect(parseDepth({ value }, config)).toBeCloseTo(expected)
  })
})

describe('parseBoolean()', () => {
  test.each`
    value        | default_     | expected
    ${'true'}    | ${undefined} | ${true}
    ${'TRUE'}    | ${undefined} | ${true}
    ${'True'}    | ${undefined} | ${true}
    ${'true '}   | ${undefined} | ${true}
    ${' true'}   | ${undefined} | ${true}
    ${' true '}  | ${undefined} | ${true}
    ${'false'}   | ${undefined} | ${false}
    ${'FALSE'}   | ${undefined} | ${false}
    ${'False'}   | ${undefined} | ${false}
    ${'false '}  | ${undefined} | ${false}
    ${' false'}  | ${undefined} | ${false}
    ${' false '} | ${undefined} | ${false}
    ${''}        | ${undefined} | ${null}
    ${' '}       | ${undefined} | ${null}
    ${null}      | ${undefined} | ${null}
    ${undefined} | ${undefined} | ${null}
    ${'true'}    | ${false}     | ${true}
    ${'false'}   | ${true}      | ${false}
    ${null}      | ${true}      | ${true}
    ${null}      | ${false}     | ${false}
    ${''}        | ${true}      | ${true}
    ${''}        | ${false}     | ${false}
    ${' '}       | ${true}      | ${true}
    ${' '}       | ${false}     | ${false}
  `('\'$value\' (default=$default_) is $expected', ({ value, default_, expected }) => {
    expect(parseBoolean(value, default_)).toBe(expected)
  })

  test.each`
    value
    ${'abc'}
    ${'1'}
  `('\'$value\' to throw error', ({ value }) => {
    expect(() => parseBoolean(value)).toThrow()
  })
})

describe('parseCsv()', () => {
  test.each`
    file                       | skipLines | expected
    ${'empty.csv'}             | ${0}      | ${[]}
    ${'header-only.csv'}       | ${0}      | ${[]}
    ${'one-column.csv'}        | ${0}      | ${[{ x: '1' }, { x: '3' }]}
    ${'two-columns.csv'}       | ${0}      | ${[{ x: '1', y: '2' }, { x: '3', y: '4' }]}
    ${'skip-1.csv'}            | ${1}      | ${[{ x: '1', y: '2' }, { x: '3', y: '4' }]}
    ${'skip-2.csv'}            | ${2}      | ${[{ x: '1', y: '2' }, { x: '3', y: '4' }]}
    ${'empty-line-start.csv'}  | ${0}      | ${[{ x: '1', y: '2' }, { x: '3', y: '4' }]}
    ${'empty-line-middle.csv'} | ${0}      | ${[{ x: '1', y: '2' }, { x: '3', y: '4' }]}
    ${'empty-line-end.csv'}    | ${0}      | ${[{ x: '1', y: '2' }, { x: '3', y: '4' }]}
  `('file: $file parses', ({ file, skipLines, expected }) => {
    const filepath = path.join(__dirname, 'files/parseCsv', file)
    const csv = readFileSync(filepath, { encoding: 'utf8' }).toString()
    const { data, meta } = parseCsv(csv, skipLines)
    expect(data).toEqual(expected)
    if (data.length > 0) {
      expect(meta.fields).toEqual(Object.keys(data[0]))
    }
  })

  test.each`
    file                       | skipLines
    ${'missing-value.csv'}     | ${0}
    ${'extra-value.csv'}       | ${0}
  `('file: $file fails', ({ file, skipLines }) => {
    const filepath = path.join(__dirname, 'files/parseCsv', file)
    const csv = readFileSync(filepath, { encoding: 'utf8' }).toString()
    expect(() => parseCsv(csv, skipLines)).toThrow()
  })
})

describe('parseProfilesFile()', () => {
  const filepath = 'files/parseProfilesFile/profiles.csv'
  const nRows = 151
  let parsed = null
  const stations = [
    { id: 1, code: 'SITE_01', timezone: 'US/Alaska' },
    { id: 2, code: 'SITE_02', timezone: 'US/Pacific' }
  ]
  const defaultConfig = {
    file_type: 'PROFILES',
    station_code: 'SITE_01',
    datetime_column: 'date',
    time_column: 'time',
    datetime_format: 'yyyy-MM-dd HH:mm',
    timezone: 'LOCAL',
    temperature_column: 'temp_c',
    temperature_units: 'C',
    depth_column: 'depth_m',
    depth_units: 'm'
  }
  beforeAll(async () => {
    const csv = readFileSync(path.join(__dirname, filepath), { encoding: 'utf8' }).toString()
    parsed = parseCsv(csv)
  })

  test('file was loaded', () => {
    expect(parsed.data).toHaveLength(nRows)
  })

  test('minimal', () => {
    const config = validateFileConfig(defaultConfig, parsed.meta.fields, stations)
    const profiles = parseProfilesFile(parsed.data, config, stations)
    expect(profiles).toHaveLength(10)
    expect(profiles[0]).toMatchObject({
      station_id: stations[0].id,
      date: '2015-06-04',
      accuracy: undefined,
      reviewed: false
    })
    expect(profiles[0].values).toHaveLength(19)
    expect(profiles[0].values[0]).toHaveProperty('datetime', '2015-06-05T01:00:00.000Z')
    expect(profiles[0].values[0].depth_m).toBeCloseTo(1.4298)
    expect(profiles[0].values[0].value).toBeCloseTo(14.56947)
  })

  describe('station_column', () => {
    test('station_code', () => {
      const config = validateFileConfig({
        ...defaultConfig,
        station_code: undefined,
        station_column: 'station_code'
      }, parsed.meta.fields, stations)
      const profiles = parseProfilesFile(parsed.data, config, stations)
      expect(profiles).toHaveLength(10)
      expect(profiles[0]).toMatchObject({
        station_id: stations[0].id,
        date: '2015-06-04',
        accuracy: undefined,
        reviewed: false
      })
      expect(profiles[0].values).toHaveLength(19)
      expect(profiles[0].values[0]).toHaveProperty('datetime', '2015-06-05T01:00:00.000Z')
      expect(profiles[0].values[0].depth_m).toBeCloseTo(1.4298)
      expect(profiles[0].values[0].value).toBeCloseTo(14.56947)

      expect(profiles[5]).toMatchObject({
        station_id: stations[1].id,
        date: '2019-09-20',
        accuracy: undefined,
        reviewed: false
      })
      expect(profiles[5].values).toHaveLength(15)
      expect(profiles[5].values[0]).toHaveProperty('datetime', '2019-09-20T13:00:00.000Z')
      expect(profiles[5].values[0].depth_m).toBeCloseTo(1.6632)
      expect(profiles[5].values[0].value).toBeCloseTo(14.21176)
    })
  })

  describe('temperature', () => {
    test('units=F', () => {
      const config = validateFileConfig({
        ...defaultConfig,
        temperature_units: 'F'
      }, parsed.meta.fields, stations)
      const profiles = parseProfilesFile(parsed.data, config, stations)
      expect(profiles[0].values[0].value).toBeCloseTo((14.56947 - 32) * 5 / 9)
    })
  })

  describe('depth', () => {
    test('units=ft', () => {
      const config = validateFileConfig({
        ...defaultConfig,
        depth_units: 'ft'
      }, parsed.meta.fields, stations)
      const profiles = parseProfilesFile(parsed.data, config, stations)
      expect(profiles[0].values[0].depth_m).toBeCloseTo(1.4298 * 0.3048)
    })
  })
})
