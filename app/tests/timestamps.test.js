/* eslint-env jest */

const { parseTimestamp, guessUtcOffset, formatTimestamp } = require('../src/lib/utils')

describe('parseTimestamp()', () => {
  test('missing value fails', () => {
    expect(() => parseTimestamp(null)).toThrow()
  })
  test('invalid value fails', () => {
    expect(() => parseTimestamp('invalid').toISOString()).toThrow()
  })
  test('null fails', () => {
    expect(() => parseTimestamp(null)).toThrow()
  })
  test('undefined fails', () => {
    expect(() => parseTimestamp(undefined)).toThrow()
  })
  test('empty string fails', () => {
    expect(() => parseTimestamp('')).toThrow()
  })
  test('empty string with space fails', () => {
    expect(() => parseTimestamp(' ')).toThrow()
  })
  test('Date object fails', () => {
    expect(() => parseTimestamp(new Date('2022-09-06T12:00:00.000Z'))).toThrow()
  })
  describe('without utcOffset', () => {
    describe('daylight time (UTC-8)', () => {
      test('ISO 8601 UTC value passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000Z').toISOString()).toBe('2022-09-06T12:00:00.000Z')
      })
      test('ISO 8601 UTC value w/o Z passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000').toISOString()).toBe('2022-09-06T12:00:00.000Z')
      })
      test('ISO 8601 value with -HHMM timezone passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000-0800').toISOString()).toBe('2022-09-06T20:00:00.000Z')
      })
      test('ISO 8601 value with -HH timezone passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000-08').toISOString()).toBe('2022-09-06T20:00:00.000Z')
      })
      test('M/DD/YYYY HH:MM:SS value passes', () => {
        expect(parseTimestamp('9/06/2022 12:00:00').toISOString()).toBe('2022-09-06T12:00:00.000Z')
      })
      test('M/DD/YYYY HH:MM:SS value with -HHMM timezone passes', () => {
        expect(parseTimestamp('9/06/2022 12:00:00-0800').toISOString()).toBe('2022-09-06T20:00:00.000Z')
      })
      test('M/D/YY HH:MM:SS value passes', () => {
        expect(parseTimestamp('9/6/22 12:00:00').toISOString()).toBe('2022-09-06T12:00:00.000Z')
      })
    })
    describe('standard time (UTC-9)', () => {
      test('ISO 8601 UTC value passes', () => {
        expect(parseTimestamp('2022-01-06T12:00:00.000Z').toISOString()).toBe('2022-01-06T12:00:00.000Z')
      })
      test('ISO 8601 UTC value w/o Z passes', () => {
        expect(parseTimestamp('2022-01-06T12:00:00.000').toISOString()).toBe('2022-01-06T12:00:00.000Z')
      })
      test('ISO 8601 value with -HHMM timezone passes', () => {
        expect(parseTimestamp('2022-01-06T12:00:00.000-0800').toISOString()).toBe('2022-01-06T20:00:00.000Z')
      })
      test('ISO 8601 value with -HH timezone passes', () => {
        expect(parseTimestamp('2022-01-06T12:00:00.000-08').toISOString()).toBe('2022-01-06T20:00:00.000Z')
      })
      test('M/DD/YYYY HH:MM:SS value passes', () => {
        expect(parseTimestamp('1/06/2022 12:00:00').toISOString()).toBe('2022-01-06T12:00:00.000Z')
      })
      test('M/DD/YYYY HH:MM:SS value with -HHMM timezone passes', () => {
        expect(parseTimestamp('1/06/2022 12:00:00-0800').toISOString()).toBe('2022-01-06T20:00:00.000Z')
      })
      test('M/D/YY HH:MM:SS value passes', () => {
        expect(parseTimestamp('1/6/22 12:00:00').toISOString()).toBe('2022-01-06T12:00:00.000Z')
      })
    })
  })
  describe('with utcOffset', () => {
    describe('daylight time (UTC-8)', () => {
      test('ISO 8601 UTC value and utcOffset=-8 passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000Z', -8).toISOString()).toBe('2022-09-06T20:00:00.000Z')
      })
      test('ISO 8601 UTC value and utcOffset=-9 passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000Z', -9).toISOString()).toBe('2022-09-06T21:00:00.000Z')
      })
      test('ISO 8601 UTC value w/o Z and utcOffset=-8 passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000', -8).toISOString()).toBe('2022-09-06T20:00:00.000Z')
      })
      test('ISO 8601 value with -HHMM timezone and utcOffset=-8 passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000-0800', -8).toISOString()).toBe('2022-09-07T04:00:00.000Z')
      })
      test('ISO 8601 value with -HH timezone and utcOffset=-8 passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000-08', -8).toISOString()).toBe('2022-09-07T04:00:00.000Z')
      })
      test('M/DD/YYYY HH:MM:SS value and utcOffset=-8 passes', () => {
        expect(parseTimestamp('9/06/2022 12:00:00', -8).toISOString()).toBe('2022-09-06T20:00:00.000Z')
      })
      test('M/DD/YYYY HH:MM:SS value with -HHMM timezone and utcOffset=-8 passes', () => {
        expect(parseTimestamp('9/06/2022 12:00:00-0800', -8).toISOString()).toBe('2022-09-07T04:00:00.000Z')
      })
      test('M/D/YY HH:MM:SS value and utcOffset=-8 passes', () => {
        expect(parseTimestamp('9/6/22 12:00:00', -8).toISOString()).toBe('2022-09-06T20:00:00.000Z')
      })
    })
    describe('standard time (UTC-9)', () => {
      test('ISO 8601 UTC value and utcOffset=-8 passes', () => {
        expect(parseTimestamp('2022-09-06T12:00:00.000Z', -8).toISOString()).toBe('2022-09-06T20:00:00.000Z')
      })
      test('ISO 8601 UTC value and utcOffset=-9 passes', () => {
        expect(parseTimestamp('2022-01-06T12:00:00.000Z', -9).toISOString()).toBe('2022-01-06T21:00:00.000Z')
      })
      test('ISO 8601 UTC value w/o Z and utcOffset=-8 passes', () => {
        expect(parseTimestamp('2022-01-06T12:00:00.000', -8).toISOString()).toBe('2022-01-06T20:00:00.000Z')
      })
      test('ISO 8601 value with -HHMM timezone and utcOffset=-8 passes', () => {
        expect(parseTimestamp('2022-01-06T12:00:00.000-0800', -8).toISOString()).toBe('2022-01-07T04:00:00.000Z')
      })
      test('ISO 8601 value with -HH timezone and utcOffset=-8 passes', () => {
        expect(parseTimestamp('2022-01-06T12:00:00.000-08', -8).toISOString()).toBe('2022-01-07T04:00:00.000Z')
      })
      test('M/DD/YYYY HH:MM:SS value and utcOffset=-8 passes', () => {
        expect(parseTimestamp('1/06/2022 12:00:00', -8).toISOString()).toBe('2022-01-06T20:00:00.000Z')
      })
      test('M/DD/YYYY HH:MM:SS value with -HHMM timezone and utcOffset=-8 passes', () => {
        expect(parseTimestamp('1/06/2022 12:00:00-0800', -8).toISOString()).toBe('2022-01-07T04:00:00.000Z')
      })
      test('M/D/YY HH:MM:SS value and utcOffset=-8 passes', () => {
        expect(parseTimestamp('1/6/22 12:00:00', -8).toISOString()).toBe('2022-01-06T20:00:00.000Z')
      })
    })
  })
})

describe('guessUtcOffset()', () => {
  const tz = 'US/Alaska'
  test('invalid value fails', () => {
    expect(() => guessUtcOffset('invalid', tz)).toThrow()
  })
  test('null fails', () => {
    expect(() => guessUtcOffset(null, tz)).toThrow()
  })
  test('undefined fails', () => {
    expect(() => guessUtcOffset(undefined, tz)).toThrow()
  })
  test('empty string fails', () => {
    expect(() => guessUtcOffset('', tz)).toThrow()
  })
  test('empty string with space fails', () => {
    expect(() => guessUtcOffset(' ', tz)).toThrow()
  })
  describe('daylight time (UTC-8)', () => {
    test('ISO 8601 value passes', () => {
      expect(guessUtcOffset('2022-09-06T12:00:00.000Z', tz)).toBe(-8)
    })
    test('M/D/YYYY HH:MM value passes', () => {
      expect(guessUtcOffset('9/6/2022 12:00', tz)).toBe(-8)
    })
  })
  describe('standard time (UTC-9)', () => {
    test('ISO 8601 value passes', () => {
      expect(guessUtcOffset('2022-01-06T12:00:00.000Z', tz)).toBe(-9)
    })
    test('M/D/YYYY HH:MM value passes', () => {
      expect(guessUtcOffset('1/6/2022 12:00', tz)).toBe(-9)
    })
  })
})

describe('formatTimestamp()', () => {
  const tz = 'US/Alaska'
  describe('to alaska daylight time (UTC-8)', () => {
    test('ISO 8601 UTC value passes', () => {
      expect(formatTimestamp(parseTimestamp('2022-09-06T12:00:00.000Z'), 'lll z', tz)).toBe('Sep 6, 2022 4:00 AM AKDT')
    })
    test('YYYY-MM-DD HH:MM value and utcOffset=-8 passes', () => {
      expect(formatTimestamp(parseTimestamp('2022-09-06 12:00', -8), 'lll z', tz)).toBe('Sep 6, 2022 12:00 PM AKDT')
    })
    test('M/D/YYYY HH:MM value and utcOffset=-8 passes', () => {
      expect(formatTimestamp(parseTimestamp('9/6/2022 12:00', -8), 'lll z', tz)).toBe('Sep 6, 2022 12:00 PM AKDT')
    })
    test('M/D/YYYY HH:MM value and utcOffset=-9 passes', () => {
      expect(formatTimestamp(parseTimestamp('9/6/2022 12:00', -9), 'lll z', tz)).toBe('Sep 6, 2022 1:00 PM AKDT')
    })
  })
  describe('to alaska standard time (UTC-9)', () => {
    test('ISO 8601 UTC value passes', () => {
      expect(formatTimestamp(parseTimestamp('2022-01-06T12:00:00.000Z'), 'lll z', tz)).toBe('Jan 6, 2022 3:00 AM AKST')
    })
    test('YYYY-MM-DD HH:MM value and utcOffset=-8 passes', () => {
      expect(formatTimestamp(parseTimestamp('2022-01-06 12:00', -9), 'lll z', tz)).toBe('Jan 6, 2022 12:00 PM AKST')
    })
    test('M/D/YYYY HH:MM value and utcOffset=-9 passes', () => {
      expect(formatTimestamp(parseTimestamp('1/6/2022 12:00', -9), 'lll z', tz)).toBe('Jan 6, 2022 12:00 PM AKST')
    })
    test('M/D/YYYY HH:MM value and utcOffset=-8 passes', () => {
      expect(formatTimestamp(parseTimestamp('1/6/2022 12:00', -8), 'lll z', tz)).toBe('Jan 6, 2022 11:00 AM AKST')
    })
  })
  describe('to local timezone (daylight)', () => {
    const tz = undefined
    test('ISO 8601 UTC value passes', () => {
      expect(formatTimestamp(parseTimestamp('2022-09-06T12:00:00.000Z'), 'lll z', tz)).toBe('Sep 6, 2022 8:00 AM EDT')
    })
    test('YYYY-MM-DD HH:MM value and utcOffset=-8 passes', () => {
      expect(formatTimestamp(parseTimestamp('2022-09-06 12:00', -8), 'lll z', tz)).toBe('Sep 6, 2022 4:00 PM EDT')
    })
    test('M/D/YYYY HH:MM value and utcOffset=-8 passes', () => {
      expect(formatTimestamp(parseTimestamp('9/6/2022 12:00', -8), 'lll z', tz)).toBe('Sep 6, 2022 4:00 PM EDT')
    })
    test('M/D/YYYY HH:MM value and utcOffset=-9 passes', () => {
      expect(formatTimestamp(parseTimestamp('9/6/2022 12:00', -9), 'lll z', tz)).toBe('Sep 6, 2022 5:00 PM EDT')
    })
  })
  describe('to local timezone (standard)', () => {
    const tz = undefined
    test('ISO 8601 UTC value passes', () => {
      expect(formatTimestamp(parseTimestamp('2022-01-06T12:00:00.000Z'), 'lll z', tz)).toBe('Jan 6, 2022 7:00 AM EST')
    })
    test('YYYY-MM-DD HH:MM value and utcOffset=-8 passes', () => {
      expect(formatTimestamp(parseTimestamp('2022-01-06 12:00', -8), 'lll z', tz)).toBe('Jan 6, 2022 3:00 PM EST')
    })
    test('M/D/YYYY HH:MM value and utcOffset=-8 passes', () => {
      expect(formatTimestamp(parseTimestamp('1/6/2022 12:00', -8), 'lll z', tz)).toBe('Jan 6, 2022 3:00 PM EST')
    })
    test('M/D/YYYY HH:MM value and utcOffset=-9 passes', () => {
      expect(formatTimestamp(parseTimestamp('1/6/2022 12:00', -9), 'lll z', tz)).toBe('Jan 6, 2022 4:00 PM EST')
    })
  })
})
