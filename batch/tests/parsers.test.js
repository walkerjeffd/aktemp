/* eslint-env jest */

const { parseTimestamp, parseValue, parseDepth } = require('../lib/parsers')

describe('timestamp parser', () => {
  const config = {
    timestamp: {
      columns: ['datetime'],
      timezone: {
        mode: 'UTCOFFSET',
        utcOffset: 0
      }
    }
  }
  test('missing value fails', () => {
    expect(() => parseTimestamp({}, config)).toThrow()
  })
  test('invalid value fails', () => {
    expect(() => parseTimestamp({ datetime: 'invalid' }, config)).toThrow()
  })
  describe('utcOffset(0) mode', () => {
    const config = {
      timestamp: {
        columns: ['datetime'],
        timezone: {
          mode: 'UTCOFFSET',
          utcOffset: 0
        }
      }
    }
    test('ISO timestamp passes', () => {
      expect(parseTimestamp({ datetime: '2022-05-04T16:35:00' }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
    test('ISO timestamp w/ decimal seconds passes', () => {
      expect(parseTimestamp({ datetime: '2022-05-04T16:35:00.000' }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
    test('ISO timestamp w/o seconds passes', () => {
      expect(parseTimestamp({ datetime: '2022-05-04T16:35' }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
    test('local timestamp passes', () => {
      expect(parseTimestamp({ datetime: '5/4/2022 16:35:00' }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
    test('local timestamp w/o seconds passes', () => {
      expect(parseTimestamp({ datetime: '5/4/2022 16:35' }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
    test('local timestamp in pm passes', () => {
      expect(parseTimestamp({ datetime: '5/4/2022 4:35 pm' }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
    test('local timestamp in PM passes', () => {
      expect(parseTimestamp({ datetime: '5/4/2022 4:35 PM' }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
  })
  describe('utcOffset(-8) mode', () => {
    const config = {
      timestamp: {
        columns: ['datetime'],
        timezone: {
          mode: 'UTCOFFSET',
          utcOffset: -8
        }
      }
    }
    test('ISO timestamp passes', () => {
      expect(parseTimestamp({ datetime: '2022-05-04T16:35:00.000' }, config)).toBe('2022-05-05T00:35:00.000Z')
    })
    test('local timestamp passes', () => {
      expect(parseTimestamp({ datetime: '5/4/2022 16:35:00' }, config)).toBe('2022-05-05T00:35:00.000Z')
    })
    test('local timestamp in PM passes', () => {
      expect(parseTimestamp({ datetime: '5/4/2022 4:35 PM' }, config)).toBe('2022-05-05T00:35:00.000Z')
    })
  })
  describe('timestamp mode', () => {
    const config = {
      timestamp: {
        columns: ['datetime'],
        timezone: {
          mode: 'TIMESTAMP'
        }
      }
    }
    test('ISO timestamp ends in Z passes', () => {
      expect(parseTimestamp({ datetime: '2022-05-04T16:35:00.000Z' }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
    test('ISO timestamp ends in -08 fails', () => {
      expect(() => parseTimestamp({ datetime: '2022-05-04T16:35:00.000-08' }, config)).toThrow()
    })
    test('ISO timestamp ends in -0800 passes', () => {
      expect(parseTimestamp({ datetime: '2022-05-04T16:35:00.000-0800' }, config)).toBe('2022-05-05T00:35:00.000Z')
    })
  })
  describe('column mode', () => {
    const config = {
      timestamp: {
        columns: ['datetime'],
        timezone: {
          mode: 'COLUMN',
          column: 'utcOffset'
        }
      }
    }
    test('ISO timestamp with utcOffset(invalid) fails', () => {
      expect(() => parseTimestamp({ datetime: '2022-05-04T16:35:00', utcOffset: 'invalid' }, config)).toThrow()
    })
    test('ISO timestamp with utcOffset(0) passes', () => {
      expect(parseTimestamp({ datetime: '2022-05-04T16:35:00', utcOffset: 0 }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
    test('ISO timestamp with utcOffset(-8) passes', () => {
      expect(parseTimestamp({ datetime: '2022-05-04T16:35:00', utcOffset: -8 }, config)).toBe('2022-05-05T00:35:00.000Z')
    })
    test('ISO timestamp with utcOffset(\'-8\') passes', () => {
      expect(parseTimestamp({ datetime: '2022-05-04T16:35:00', utcOffset: '-8' }, config)).toBe('2022-05-05T00:35:00.000Z')
    })
    test('local timestamp with utcOffset(0) passes', () => {
      expect(parseTimestamp({ datetime: '5/4/2022 16:35:00', utcOffset: 0 }, config)).toBe('2022-05-04T16:35:00.000Z')
    })
    test('local timestamp with utcOffset(-8) passes', () => {
      expect(parseTimestamp({ datetime: '5/4/2022 16:35:00', utcOffset: -8 }, config)).toBe('2022-05-05T00:35:00.000Z')
    })
  })
})

describe('value parser', () => {
  const config = {
    value: {
      column: 'temp',
      missing: [],
      units: 'C'
    }
  }
  test('missing value fails', () => {
    expect(() => parseValue({ }, config)).toThrow()
  })
  test('string value fails', () => {
    expect(() => parseValue({ temp: 'invalid' }, config)).toThrow()
  })
  test('string value in missing passes', () => {
    const config = {
      value: {
        column: 'temp',
        missing: ['NA'],
        units: 'C'
      }
    }
    expect(parseValue({ temp: 'NA' }, config)).toBeNull()
  })
  test('numeric value passes', () => {
    expect(parseValue({ temp: 5.1 }, config)).toBeCloseTo(5.1)
  })
  test('32F converted to 0C', () => {
    const config = {
      value: {
        column: 'temp',
        missing: [],
        units: 'F'
      }
    }
    expect(parseValue({ temp: 32 }, config)).toBeCloseTo(0)
  })
  test('70F converted to C', () => {
    const config = {
      value: {
        column: 'temp',
        missing: [],
        units: 'F'
      }
    }
    expect(parseValue({ temp: 70 }, config)).toBeCloseTo((70 - 32) * 5 / 9)
  })
})

describe('depth parser', () => {
  const config = {
    depth: {
      mode: 'COLUMN',
      column: 'depth',
      units: 'm'
    }
  }
  test('missing value fails', () => {
    expect(() => parseDepth({ }, config)).toThrow()
  })
  test('string value fails', () => {
    expect(() => parseDepth({ depth: 'invalid' }, config)).toThrow()
  })
  test('numeric value passes', () => {
    expect(parseDepth({ depth: 5.1 }, config)).toBeCloseTo(5.1)
  })
  test('convert ft to m', () => {
    const config = {
      depth: {
        mode: 'COLUMN',
        column: 'depth',
        units: 'ft'
      }
    }
    expect(parseDepth({ depth: 1 }, config)).toBeCloseTo(0.3048)
  })
  test('convert in to m', () => {
    const config = {
      depth: {
        mode: 'COLUMN',
        column: 'depth',
        units: 'in'
      }
    }
    expect(parseDepth({ depth: 12 }, config)).toBeCloseTo(0.3048)
  })
  test('convert cm to m', () => {
    const config = {
      depth: {
        mode: 'COLUMN',
        column: 'depth',
        units: 'cm'
      }
    }
    expect(parseDepth({ depth: 100 }, config)).toBeCloseTo(1)
  })
})
