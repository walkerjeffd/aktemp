/* eslint-env jest */

const {
  formatTimestamp,
  getTimestampString,
  parseTimestampString,
  adjustTimestampToUtc,
  getLocalUtcOffsetTimezone,
  convertUtcOffsetToTimezone,
  guessDatetimeFormat,
  countDays,
  luxon
} = require('../time')

const dateFormatValues = [
  {
    format: 'M/d/yy',
    values: [
      ['01/02/2022', '2022-01-02'],
      ['01/2/2022', '2022-01-02'],
      ['1/02/2022', '2022-01-02'],
      ['1/2/2022', '2022-01-02'],
      ['01/02/22', '2022-01-02'],
      ['01/2/22', '2022-01-02'],
      ['1/02/22', '2022-01-02'],
      ['1/2/22', '2022-01-02']
    ]
  }, {
    format: 'yy-M-d',
    values: [
      ['2022-01-02', '2022-01-02'],
      ['22-01-02', '2022-01-02'],
      ['2022-1-2', '2022-01-02'],
      ['22-1-2', '2022-01-02']
    ]
  }, {
    format: 'MMMM d, yy',
    values: [
      ['January 02, 2022', '2022-01-02'],
      ['January 2, 2022', '2022-01-02']
    ]
  }, {
    format: 'MMM d, yy',
    values: [
      ['Jan 02, 2022', '2022-01-02'],
      ['Jan 2, 2022', '2022-01-02'],
      ['Jan 02, 22', '2022-01-02'],
      ['Jan 2, 22', '2022-01-02']
    ]
  }, {
    format: 'd-MMMM-yy',
    values: [
      ['02-January-2022', '2022-01-02'],
      ['2-January-2022', '2022-01-02']
    ]
  }, {
    format: 'd-MMM-yy',
    values: [
      ['02-Jan-2022', '2022-01-02'],
      ['2-Jan-2022', '2022-01-02'],
      ['02-Jan-22', '2022-01-02'],
      ['2-Jan-22', '2022-01-02']
    ]
  }
]

const timeFormatValues = [
  {
    format: 'H:mm',
    values: [
      ['13:30', '13:30:00.000'],
      ['01:30', '01:30:00.000'],
      ['1:30', '01:30:00.000']
    ]
  }, {
    format: 'H:mm:ss',
    values: [
      ['01:30:00', '01:30:00.000'],
      ['1:30:00', '01:30:00.000']
    ]
  }, {
    format: 'H:mm:ss.u',
    values: [
      ['01:30:30.005', '01:30:30.005'],
      ['13:30:30.500', '13:30:30.500']
    ]
  }, {
    format: 'h:mm a',
    values: [
      ['01:30 AM', '01:30:00.000'],
      ['1:30 AM', '01:30:00.000'],
      ['01:30 PM', '13:30:00.000'],
      ['1:30 PM', '13:30:00.000']
    ]
  }, {
    format: 'h:mm:ss a',
    values: [
      ['01:30:30 PM', '13:30:30.000']
    ]
  }, {
    format: 'h:mm:ss.u a',
    values: [
      ['01:30:30.005 PM', '13:30:30.005']
    ]
  }
]

describe('formatTimestamp()', () => {
  test.each`
    value                         | format       | tz             | expected
    ${'2022-10-19T17:38:04.635Z'} | ${'ISO'}     | ${''}          | ${'2022-10-19T17:38:04.635Z'}
    ${'2022-10-19T17:38:04.635Z'} | ${'ISO'}     | ${'US/Alaska'} | ${'2022-10-19T09:38:04.635-08:00'}
    ${'2022-10-19T17:38:04.635Z'} | ${'ISO'}     | ${'US/Pacific'}| ${'2022-10-19T10:38:04.635-07:00'}
    ${'2022-10-19T17:38:04.635Z'} | ${'DD ttt'}  | ${'US/Alaska'} | ${'Oct 19, 2022 9:38:04 AM AKDT'}
    ${'2022-02-19T17:38:04.635Z'} | ${'fff'}     | ${'US/Alaska'} | ${'February 19, 2022 at 8:38 AM AKST'}
    ${'2022-10-19T17:38:04.635Z'} | ${'ff ZZZZ'} | ${'US/Alaska'} | ${'Oct 19, 2022, 9:38 AM AKDT'}
    ${'2022-10-19T17:38:04.635Z'} | ${'ff ZZZZ'} | ${'US/Pacific'}| ${'Oct 19, 2022, 10:38 AM PDT'}
    ${'2022-10-19T00:38:04.635Z'} | ${'y-MM-dd'} | ${'US/Alaska'} | ${'2022-10-18'}
    ${'2022-10-19T17:38:04.635Z'} | ${'DD'}      | ${''}          | ${'Oct 19, 2022'}
    ${'2022-10-19T17:38:04.635Z'} | ${'ff ZZZZ'} | ${''}          | ${'Oct 19, 2022, 5:38 PM UTC'}
    ${null}                       | ${'ff ZZZZ'} | ${''}          | ${''}
    ${''}                         | ${'ff ZZZZ'} | ${''}          | ${''}
    ${undefined}                  | ${'ff ZZZZ'} | ${''}          | ${''}
    ${'INVALID'}                  | ${'ff ZZZZ'} | ${''}          | ${'Invalid Timestamp'}
  `('\'$value\', format=\'$format\', tz=\'$tz\' is \'$expected\'', ({ value, format, tz, expected }) => {
    expect(formatTimestamp(value, format, tz)).toEqual(expected)
  })

  test.each`
    value                         | format       | tz             | expected
    ${'2022-10-19T17:38:04.635Z'} | ${'ff ZZZZ'} | ${'US/Alaska'} | ${'Oct 19, 2022, 9:38 AM AKDT'}
  `('DateTime(\'$value\'), format=\'$format\', tz=\'$tz\' is \'$expected\'', ({ value, format, tz, expected }) => {
    const dt = luxon.DateTime.fromISO(value, { zone: 'UTC' })
    expect(formatTimestamp(dt, format, tz)).toEqual(expected)
  })
})

describe('getTimestampString()', () => {
  describe('datetime column', () => {
    const columns = ['datetime']
    const row = { datetime: '2022-10-12T12:00:00.000Z' }

    test('valid value passes', () => {
      expect(getTimestampString(row, columns)).toEqual(row.datetime)
    })
    test('missing value fails', () => {
      expect(() => getTimestampString({}, columns)).toThrow()
      expect(() => getTimestampString({ datetime: null }, columns)).toThrow()
      expect(() => getTimestampString({ datetime: '' }, columns)).toThrow()
      expect(() => getTimestampString({ datetime: ' ' }, columns)).toThrow()
      expect(() => getTimestampString({ datetime: undefined }, columns)).toThrow()
    })
  })
  describe('date + time columns', () => {
    const columns = ['date', 'time']
    const row = { date: '2022-10-12', time: '12:00:00' }

    test('valid value passes', () => {
      expect(getTimestampString(row, ...columns)).toEqual(`${row.date} ${row.time}`)
    })
    test('missing date fails', () => {
      expect(() => getTimestampString({ time: row.time }, ...columns)).toThrow()
      expect(() => getTimestampString({ time: row.time, date: '' }, ...columns)).toThrow()
      expect(() => getTimestampString({ time: row.time, date: ' ' }, ...columns)).toThrow()
      expect(() => getTimestampString({ time: row.time, date: null }, ...columns)).toThrow()
      expect(() => getTimestampString({ time: row.time, date: undefined }, ...columns)).toThrow()
    })
    test('missing time fails', () => {
      expect(() => getTimestampString({ date: row.date }, ...columns)).toThrow()
      expect(() => getTimestampString({ date: row.date, time: '' }, ...columns)).toThrow()
      expect(() => getTimestampString({ date: row.date, time: ' ' }, ...columns)).toThrow()
      expect(() => getTimestampString({ date: row.date, time: null }, ...columns)).toThrow()
      expect(() => getTimestampString({ date: row.date, time: undefined }, ...columns)).toThrow()
    })
  })

  test('too many columns fails', () => {
    const columns = ['date', 'time', 'another']
    const row = { date: '2022-10-12', time: '12:00:00' }
    expect(() => getTimestampString(row, columns)).toThrow()
  })
})

describe('parseTimestampString()', () => {
  describe('ISO format', () => {
    test.each`
      value                             | expected
      ${'2022-10-12T00:00:00.000Z'}     | ${'2022-10-12T00:00:00.000Z'}
      ${'2022-10-12T00:00:00.000'}      | ${'2022-10-12T00:00:00.000Z'}
      ${'2022-10-12T00:00:00'}          | ${'2022-10-12T00:00:00.000Z'}
      ${'2022-10-12T00:00:00.000-08'}   | ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12T00:00:00-08'}       | ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12T00:00-08'}          | ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12T00:00:00.000-0800'} | ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12T00:00:00.000-08:00'}| ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12 00:00:00.000Z'}     | ${'2022-10-12T00:00:00.000Z'}
      ${'2022-10-12 00:00:00.000'}      | ${'2022-10-12T00:00:00.000Z'}
      ${'2022-10-12 00:00:00'}          | ${'2022-10-12T00:00:00.000Z'}
      ${'2022-10-12 00:00:00.000-08'}   | ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12 00:00:00-08'}       | ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12 00:00-08'}          | ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12 00:00:00.000-0800'} | ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12 00:00:00.000-08:00'}| ${'2022-10-12T08:00:00.000Z'}
      ${'2022-10-12'}                   | ${'2022-10-12T00:00:00.000Z'}
    `('[\'$value\'] passes', ({ value, expected }) => {
      expect(parseTimestampString(value, 'ISO').toUTC().toISO()).toEqual(expected)
    })

    test.each`
      value
      ${'10/12/2022 00:00'}
      ${'10/12/2022'}
      ${''}
      ${null}
    `('[\'$value\'] fails', ({ value }) => {
      expect(() => parseTimestampString(value, 'ISO').toUTC().toISO()).toThrow()
    })
  })
  describe('date formats', () => {
    const table = dateFormatValues.map(d => {
      return d.values.map(v => ({ value: v[0], format: d.format, expected: v[1] }))
    })

    test.each(table)('[\'$value\',\'$format\'] passes', ({ value, format, expected }) => {
      expect(parseTimestampString(`${value} 12:00`, `${format} T`).toUTC().toISO()).toEqual(`${expected}T12:00:00.000Z`)
    })

    test.each`
      value               | format
      ${''}               | ${'D'}
      ${'null'}           | ${'D'}
      ${'1/2/22'}         | ${'D'}
      ${'01/2/22'}        | ${'D'}
      ${'1/02/22'}        | ${'D'}
      ${'01/02/22'}       | ${'D'}
      ${'01/32/2022'}     | ${'D'}
      ${'01/32/2022'}     | ${'M/d/yy'}
      ${'01/02/2025'}     | ${'D'}
      ${'01/02/22'}       | ${'M/d/yyyy'}
    `('[\'$value\',\'$format\'] fails', ({ value, format }) => {
      expect(() => parseTimestampString(`${value} 12:00`, `${format} T`).toUTC().toISO()).toThrow()
    })
  })
  describe('time formats', () => {
    const table = timeFormatValues.map(d => {
      return d.values.map(v => ({ value: v[0], format: d.format, expected: v[1] }))
    }).flat()

    test.each(table)('[\'$value\',\'$format\'] passes', ({ value, format, expected }) => {
      expect(parseTimestampString(`01/01/2022 ${value}`, `D ${format}`).toUTC().toISO()).toEqual(`2022-01-01T${expected}Z`)
    })

    test.each`
      value              | format
      ${''}              | ${'T'}
      ${null}            | ${'T'}
      ${'13:30:00 PM'}   | ${'HH:mm a'}
    `('[\'$value\',\'$format\'] fails', ({ value, format }) => {
      expect(() => parseTimestampString(`01/01/2022 ${value}`, `D ${format}`).toUTC().toISO()).toThrow()
    })
  })
  describe('date+time formats', () => {
    test.each`
      value                         | format   | expected
      ${'1/2/2022 12:05'}           | ${'D T'} | ${'2022-01-02T12:05:00.000Z'}
      ${'2022-01-02T12:05:00.000Z'} | ${'ISO'} | ${'2022-01-02T12:05:00.000Z'}
    `('[\'$value\',\'$format\'] is \'$expected\'', ({ value, format, expected }) => {
      expect(parseTimestampString(value, format).toUTC().toISO()).toEqual(expected)
    })
  })
})

describe('convertUtcOffsetToTimezone()', () => {
  test.each`
    value   | expected
    ${'0'}  | ${'UTC'}
    ${'-8'} | ${'UTC-8'}
    ${'-9'} | ${'UTC-9'}
    ${-8}   | ${'UTC-8'}
  `('\'$value\' is $expected', ({ value, timezone, expected }) => {
    expect(convertUtcOffsetToTimezone(value)).toEqual(expected)
  })
  test.each`
    value
    ${'INVALID'}
    ${'AKDT'}
    ${'US/Alaska'}
    ${'-4'}
    ${'8'}
  `('\'$value\' fails', ({ value }) => {
    expect(() => convertUtcOffsetToTimezone(value)).toThrow()
  })
})

describe('adjustTimestampToUtc()', () => {
  // const value = luxon.DateTime.fromISO('2022-10-18T12:00:00.000Z', { zone: 'UTC' })
  test.each`
    value                         | timezone      | expected
    ${'2022-10-18T12:00:00.000Z'} | ${''}         | ${'2022-10-18T12:00:00.000Z'}
    ${'2022-10-18T12:00:00.000Z'} | ${'UTC'}      | ${'2022-10-18T12:00:00.000Z'}
    ${'2022-10-18T00:00:00.000Z'} | ${'UTC-08'}   | ${'2022-10-18T08:00:00.000Z'}
    ${'2022-10-18T00:00:00.000Z'} | ${'UTC-8'}    | ${'2022-10-18T08:00:00.000Z'}
    ${'2022-10-18T12:00:00.000Z'} | ${'UTC-8'}    | ${'2022-10-18T20:00:00.000Z'}
    ${'2022-10-18T23:00:00.000Z'} | ${'UTC-8'}    | ${'2022-10-19T07:00:00.000Z'}
    ${'2022-10-18T12:00:00.000Z'} | ${'UTC-9'}    | ${'2022-10-18T21:00:00.000Z'}
  `('$value in $timezone is $expected', ({ value, timezone, expected }) => {
    const dt = luxon.DateTime.fromISO(value, { zone: 'UTC' })
    expect(adjustTimestampToUtc(dt, timezone).toISO()).toEqual(expected)
  })
  test.each`
    value                         | timezone
    ${'INVALID'}                  | ${'UTC'}
    ${'2022-10-18T12:00:00.000Z'} | ${'INVALID'}
    ${'2022-10-18T00:00:00.000Z'} | ${'UTC-0800'}
  `('$value in \'$timezone\' throws', ({ value, timezone }) => {
    const dt = luxon.DateTime.fromISO(value, { zone: 'UTC' })
    expect(() => adjustTimestampToUtc(dt, timezone).toISO()).toThrow()
  })
})

// describe('getUtcOffset()', () => {
//   describe('timezoneMode=UTCOFFSET', () => {
//     test.each`
//       utcOffset | expected
//       ${'0'}    | ${0}
//       ${'-8'}   | ${-8}
//       ${'-9'}   | ${-9}
//       ${0}      | ${0}
//       ${-8}     | ${-8}
//       ${-9}     | ${-9}
//     `('utcOffset=\'$utcOffset\' passes', ({ utcOffset, expected }) => {
//       const config = {
//         timestamp: {
//           timezone: {
//             mode: 'UTCOFFSET',
//             utcOffset
//           }
//         }
//       }
//       expect(getUtcOffset({}, config)).toEqual(expected)
//     })
//     test.each`
//       utcOffset
//       ${''}
//       ${'a'}
//       ${' '}
//       ${null}
//       ${undefined}
//     `('utcOffset=\'$utcOffset\' fails', ({ utcOffset }) => {
//       const config = {
//         timestamp: {
//           timezone: {
//             mode: 'UTCOFFSET',
//             utcOffset
//           }
//         }
//       }
//       expect(() => getUtcOffset({}, config)).toThrow()
//     })
//   })
//   describe('timezoneMode=COLUMN', () => {
//     test.each`
//       utcOffset | expected
//       ${'0'}    | ${0}
//       ${'-8'}   | ${-8}
//       ${'-9'}   | ${-9}
//       ${0}      | ${0}
//       ${-8}     | ${-8}
//       ${-9}     | ${-9}
//     `('utcOffset=\'$utcOffset\' passes', ({ utcOffset, expected }) => {
//       const config = {
//         timestamp: {
//           timezone: {
//             mode: 'COLUMN',
//             column: 'utcOffset'
//           }
//         }
//       }
//       expect(getUtcOffset({ utcOffset }, config)).toEqual(expected)
//     })
//     test.each`
//       utcOffset
//       ${''}
//       ${'a'}
//       ${' '}
//       ${null}
//       ${undefined}
//     `('utcOffset=\'$utcOffset\' fails', ({ utcOffset }) => {
//       const config = {
//         timestamp: {
//           timezone: {
//             mode: 'COLUMN',
//             column: 'utcOffset'
//           }
//         }
//       }
//       expect(() => getUtcOffset({ utcOffset }, config)).toThrow()
//     })
//     test('missing column fails', () => {
//       const config = {
//         timestamp: {
//           timezone: {
//             mode: 'COLUMN',
//             column: 'invalid'
//           }
//         }
//       }
//       expect(() => adjustParsedTimestamp({ utcOffset: '-8' }, config)).toThrow()
//     })
//   })
// })

describe('getLocalUtcOffsetTimezone()', () => {
  test.each`
    value                         | format                | timezone         | expected
    ${'2022-01-02T00:00:00.000Z'} | ${'ISO'}              | ${'US/Alaska'}   | ${'UTC-9'}
    ${'2022-08-02T00:00:00.000Z'} | ${'ISO'}              | ${'US/Alaska'}   | ${'UTC-8'}
    ${'2022-01-02 00:00:00.000Z'} | ${'ISO'}              | ${'US/Alaska'}   | ${'UTC-9'}
    ${'1/2/2022 00:00'}           | ${'M/d/yy H:mm'}      | ${'US/Alaska'}   | ${'UTC-9'}
    ${'8/2/2022 00:00'}           | ${'M/d/yy H:mm'}      | ${'US/Alaska'}   | ${'UTC-8'}
    ${'2022-01-02T00:00:00.000Z'} | ${'ISO'}              | ${'US/Aleutian'} | ${'UTC-10'}
    ${'2022-08-02T00:00:00.000Z'} | ${'ISO'}              | ${'US/Aleutian'} | ${'UTC-9'}
  `('[\'$value\', \'$format\', \'$timezone\'] is \'$expected\'', ({ value, format, timezone, expected }) => {
    expect(getLocalUtcOffsetTimezone(value, format, timezone)).toEqual(expected)
  })

  test.each`
    value                         | format   | timezone
    ${''}                         | ${'ISO'} | ${'US/Alaska'}
    ${null}                       | ${'ISO'} | ${'US/Alaska'}
    ${'1/2/2022 00:00'}           | ${'ISO'} | ${'US/Alaska'}
    ${'2022-01-02T00:00:00.000Z'} | ${'ISO'} | ${''}
    ${'2022-01-02T00:00:00.000Z'} | ${'ISO'} | ${null}
    ${'2022-01-02T00:00:00.000Z'} | ${'ISO'} | ${undefined}
    ${'2022-01-02T00:00:00.000Z'} | ${'ISO'} | ${'INVALID'}
  `('[\'$value\', \'$format\', \'$timezone\'] fails', ({ value, format, timezone }) => {
    expect(() => getLocalUtcOffsetTimezone(value, format, timezone)).toThrow()
  })
})

describe('countDays()', () => {
  test.each`
    start           | end             | expected
    ${'2022-10-17'} | ${'2022-10-17'} | ${1}
    ${'2022-10-17'} | ${'2022-10-18'} | ${2}
    ${'2022-10-17'} | ${'2022-10-19'} | ${3}
    ${'2022-10-17'} | ${'2023-10-16'} | ${365}
    ${'2022-10-17'} | ${'2023-10-17'} | ${366}
    ${'2022-10-17'} | ${'2022-10-16'} | ${-2}
    ${'2022-10-17T00:00:00.000Z'} | ${'2022-10-17T00:00:00.000Z'} | ${1}
    ${'2022-10-17T00:00:00.000Z'} | ${'2022-10-17T12:00:00.000Z'} | ${1}
    ${'2022-10-17T00:00:00.000Z'} | ${'2022-10-17T23:59:59.999Z'} | ${1}
    ${'2022-10-17T00:00:00.000Z'} | ${'2022-10-18T00:00:00.000Z'} | ${2}
    ${'2022-10-17T00:00:00.000Z'} | ${'2022-10-18T01:00:00.000Z'} | ${2}
    ${'INVALID'}    | ${'2022-10-17'} | ${null}
    ${'2022-10-17'} | ${'INVALID'}    | ${null}
    ${''}           | ${'2022-10-17'} | ${null}
    ${''}           | ${''}           | ${null}
    ${'10/17/2022'} | ${'2022-10-17'} | ${null}
  `('\'$start\' to \'$end\' is $expected days', ({ start, end, expected }) => {
    expect(countDays(start, end)).toEqual(expected)
  })
})

describe('guessDatetimeFormat()', () => {
  test.each`
    value                             | expected
    ${'2022-10-12T00:00:00.000Z'}     | ${'ISO'}
    ${'2022-10-12T00:00:00.000-08'}   | ${'ISO'}
    ${'2022-10-12T00:00:00.000-08:00'}| ${'ISO'}
    ${'2022-10-12T00:00:00.000-0800'} | ${'ISO'}
    ${'2022-10-12T00:00:00.000'}      | ${'ISO'}
    ${'2022-10-12T00:00:00'}          | ${'ISO'}
    ${'2022-10-12T00:00'}             | ${'ISO'}
    ${'2022-10-12 00:00:00.000Z'}     | ${'ISO'}
    ${'2022-10-12 00:00:00.000-08'}   | ${'ISO'}
    ${'2022-10-12 00:00:00.000-08:00'}| ${'ISO'}
    ${'2022-10-12 00:00:00.000-0800'} | ${'ISO'}
    ${'2022-10-12 00:00:00.000'}      | ${'ISO'}
    ${'2022-10-12 00:00:00'}          | ${'ISO'}
    ${'2022-10-12 00:00'}             | ${'ISO'}
    ${'2022-10-12'}                   | ${'ISO'}
  `('[\'$value\'] has format $expected', ({ value, timezoneMode, expected }) => {
    expect(guessDatetimeFormat(value)).toEqual(expected)
  })

  const table = dateFormatValues.map(d => {
    return d.values.map(dv => {
      return timeFormatValues.map(t => {
        return t.values.map(tv => {
          return {
            value: `${dv[0]} ${tv[0]}`,
            expected: [d.format, t.format]
          }
        })
      }).flat()
    }).flat()
  }).flat()

  test.each(table)('[\'$value\'] has format $expected or ISO', ({ value, expected }) => {
    const format = guessDatetimeFormat(value)
    if (format === 'ISO') {
      expect(format).toEqual('ISO')
    } else {
      expect(format).toEqual(expected)
    }
  })
})
