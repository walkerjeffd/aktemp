/* eslint-env jest */

const { validateFileConfig, validateFileFields, validateSchema, schemas } = require('../lib/validators')

describe('file fields validator', () => {
  test('undefined fails', () => {
    expect(() => validateFileFields()).toThrow()
  })
  test('empty array fails', () => {
    expect(() => validateFileFields([])).toThrow()
  })
  test('array (n=1, string) fails', () => {
    expect(() => validateFileFields(['column'])).toThrow()
  })
  test('array (n=2, string) passes', () => {
    const fields = ['column1', 'column2']
    expect(validateFileFields(fields)).toMatchObject(fields)
  })
  test('array (n=1, integer) fails', () => {
    expect(() => validateFileFields([1])).toThrow()
  })
  test('empty string fails', () => {
    expect(() => validateFileFields(['column1', ''])).toThrow()
  })
  test('null fails', () => {
    expect(() => validateFileFields(['column1', null])).toThrow()
  })
  test('duplicate fails', () => {
    expect(() => validateFileFields(['column1', 'column1'])).toThrow()
  })
  test('array (n=4, string) passes', () => {
    const fields = ['column1', 'column2', 'column3', 'column4']
    expect(validateFileFields(fields)).toMatchObject(fields)
  })
})

describe('file config validator', () => {
  test('empty fields fails', () => {
    expect(() => validateFileConfig({}, [])).toThrow()
  })
  test('missing config fails', () => {
    expect(() => validateFileConfig(undefined, [])).toThrow()
  })
  describe('station', () => {
    const fields = ['station', 'datetime', 'temp', 'depth']
    const schema = schemas.station(fields)
    const valid = {
      mode: 'STATION',
      stationId: 1
    }
    test('valid stationId passes', () => {
      expect(validateSchema(schema, valid)).toMatchObject(valid)
    })
    test('valid column passes', () => {
      const value = {
        ...valid,
        mode: 'COLUMN',
        column: 'station'
      }
      expect(validateSchema(schema, value)).toMatchObject(value)
    })
    test('stationId as string fails', () => {
      const value = {
        ...valid,
        stationId: 'abc'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing stationId fails', () => {
      const value = {
        ...valid,
        stationId: undefined
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid column fails', () => {
      const value = {
        ...valid,
        mode: 'COLUMN',
        column: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing column fails', () => {
      const value = {
        ...valid,
        mode: 'COLUMN'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
  })
  describe('depth/series', () => {
    const fields = ['datetime', 'temp', 'depth']
    const schema = schemas.depth(fields, 'SERIES')
    const valid = {
      mode: 'CATEGORY',
      category: 'SURFACE'
    }
    test('valid category passes', () => {
      expect(validateSchema(schema, valid)).toMatchObject(valid)
    })
    test('valid value passes', () => {
      const value = {
        mode: 'VALUE',
        value: 1,
        units: 'm'
      }
      expect(validateSchema(schema, value)).toMatchObject(value)
    })
    test('valid column passes', () => {
      const value = {
        mode: 'COLUMN',
        column: 'depth',
        units: 'm'
      }
      expect(validateSchema(schema, value)).toMatchObject(value)
    })
    test('invalid mode fails', () => {
      const value = {
        mode: 'INVALID'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing mode fails', () => {
      const value = {}
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing category fails', () => {
      const value = {
        mode: 'CATEGORY'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid category fails', () => {
      const value = {
        mode: 'CATEGORY',
        category: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing value fails', () => {
      const value = {
        mode: 'VALUE',
        units: 'm'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid value fails', () => {
      const value = {
        mode: 'VALUE',
        value: 'invalid',
        units: 'm'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing value units fails', () => {
      const value = {
        mode: 'VALUE',
        value: 1
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid value units fails', () => {
      const value = {
        mode: 'VALUE',
        value: 1,
        units: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid column fails', () => {
      const value = {
        mode: 'COLUMN',
        column: 'invalid',
        units: 'm'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing column fails', () => {
      const value = {
        mode: 'COLUMN',
        units: 'm'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing column units fails', () => {
      const value = {
        mode: 'COLUMN',
        column: 'depth'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid column units fails', () => {
      const value = {
        mode: 'COLUMN',
        column: 'depth',
        units: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
  })
  describe('depth/profiles', () => {
    const fields = ['datetime', 'temp', 'depth']
    const schema = schemas.depth(fields, 'PROFILES')
    const valid = {
      mode: 'COLUMN',
      column: 'depth',
      units: 'm'
    }
    test('valid config passes', () => {
      expect(validateSchema(schema, valid)).toMatchObject(valid)
    })
    test('category mode fails', () => {
      const value = {
        mode: 'CATEGORY'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing mode fails', () => {
      const value = {}
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid column fails', () => {
      const value = {
        mode: 'COLUMN',
        column: 'invalid',
        units: 'm'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing column fails', () => {
      const value = {
        mode: 'COLUMN',
        units: 'm'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing column units fails', () => {
      const value = {
        mode: 'COLUMN',
        column: 'depth'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid column units fails', () => {
      const value = {
        mode: 'COLUMN',
        column: 'depth',
        units: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
  })
  describe('timestamp', () => {
    test('empty fails', () => {
      expect(() => validateSchema(schemas.timestamp(['datetime', 'temp']), {})).toThrow()
    })
    describe('columns(n=1)', () => {
      const fields = ['datetime', 'temp']
      const schema = schemas.timestamp(fields)
      const valid = {
        columns: ['datetime'],
        timezone: {
          mode: 'TIMESTAMP'
        }
      }
      test('valid schema passes', () => {
        expect(validateSchema(schema, valid)).toMatchObject(valid)
      })
      test('invalid columns fails', () => {
        expect(() => validateSchema(schema, { ...valid, columns: ['invalid'] }))
          .toThrow()
      })
      test('empty columns fails', () => {
        expect(() => validateSchema(schema, { ...valid, columns: [] }))
          .toThrow()
      })
      test('three columns fails', () => {
        expect(() => validateSchema(schema, { ...valid, columns: ['datetime', 'datetime', 'temp'] }))
          .toThrow()
      })
    })
    describe('columns(n=2)', () => {
      const fields = ['date', 'time', 'temp']
      const schema = schemas.timestamp(fields)
      const valid = {
        columns: ['date', 'time'],
        timezone: {
          mode: 'TIMESTAMP'
        }
      }
      test('valid schema passes', () => {
        expect(validateSchema(schema, valid)).toMatchObject(valid)
      })
    })
    describe('timezone', () => {
      const fields = ['datetime', 'utc_offset', 'temp']
      const schema = schemas.timestamp(fields)
      const valid = {
        columns: ['datetime'],
        timezone: {
          mode: 'TIMESTAMP'
        }
      }
      test('invalid mode fails', () => {
        const value = {
          ...valid,
          timezone: {
            mode: 'invalid'
          }
        }
        expect(() => validateSchema(schema, value)).toThrow()
      })
      test('timestamp mode passes', () => {
        expect(validateSchema(schema, valid)).toMatchObject(valid)
      })
      test('valid column mode passes', () => {
        const value = {
          ...valid,
          timezone: {
            mode: 'COLUMN',
            column: 'utc_offset'
          }
        }
        expect(validateSchema(schema, value)).toMatchObject(value)
      })
      test('invalid column mode fails', () => {
        const value = {
          ...valid,
          timezone: {
            mode: 'COLUMN',
            column: 'invalid'
          }
        }
        expect(() => validateSchema(schema, value)).toThrow()
      })
      test('missing column mode fails', () => {
        const value = {
          ...valid,
          timezone: {
            mode: 'COLUMN'
          }
        }
        expect(() => validateSchema(schema, value)).toThrow()
      })
      test('valid utcOffset mode passes', () => {
        const value = {
          ...valid,
          timezone: {
            mode: 'UTCOFFSET',
            utcOffset: -8
          }
        }
        expect(validateSchema(schema, value)).toMatchObject(value)
      })
      test('invalid utcOffset mode fails', () => {
        const value = {
          ...valid,
          timezone: {
            mode: 'UTCOFFSET',
            utcOffset: 100
          }
        }
        expect(() => validateSchema(schema, value)).toThrow()
      })
      test('missing utcOffset mode fails', () => {
        const value = {
          ...valid,
          timezone: {
            mode: 'UTCOFFSET'
          }
        }
        expect(() => validateSchema(schema, value)).toThrow()
      })
    })
  })
  describe('value', () => {
    const fields = ['datetime', 'temp']
    const schema = schemas.value(fields)
    const valid = {
      column: 'temp',
      units: 'C'
    }
    test('valid passes', () => {
      expect(validateSchema(schema, valid)).toMatchObject(valid)
    })
    test('empty missing passes', () => {
      const value = {
        ...valid,
        missing: []
      }
      expect(validateSchema(schema, value)).toMatchObject(value)
    })
    test('non-empty missing array passes', () => {
      const value = {
        ...valid,
        missing: ['missing', 'N/A']
      }
      expect(validateSchema(schema, value)).toMatchObject(value)
    })
    test('invalid column fails', () => {
      const value = {
        ...valid,
        column: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing column fails', () => {
      const value = {
        ...valid,
        column: undefined
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid units fails', () => {
      const value = {
        ...valid,
        units: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing units fails', () => {
      const value = {
        ...valid,
        units: undefined
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('missing as string fails', () => {
      const value = {
        ...valid,
        missing: 'missing'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
  })
  describe('meta/series', () => {
    const fields = ['datetime', 'temp', 'flag']
    const schema = schemas.meta(fields, 'SERIES')
    const valid = {
      interval: 'CONTINUOUS'
    }
    test('valid minimal continuous passes', () => {
      expect(validateSchema(schema, valid)).toMatchObject(valid)
    })
    test('valid full continuous passes', () => {
      const value = {
        ...valid,
        accuracy: '1',
        reviewed: true,
        flagColumn: 'flag',
        sop_bath: true
      }
      expect(validateSchema(schema, value)).toMatchObject(value)
    })
    test('valid minimal discrete passes', () => {
      const value = {
        interval: 'DISCRETE'
      }
      expect(validateSchema(schema, value)).toMatchObject(value)
    })
    test('valid full discrete passes', () => {
      const value = {
        interval: 'DISCRETE',
        accuracy: '1',
        reviewed: true,
        flagColumn: 'flag',
        sop_bath: true
      }
      expect(validateSchema(schema, value)).toMatchObject(value)
    })
    test('invalid accuracy fails', () => {
      const value = {
        ...valid,
        accuracy: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid reviewed fails', () => {
      const value = {
        ...valid,
        reviewed: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid flagColumn fails', () => {
      const value = {
        ...valid,
        accuracy: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid sop_bath fails', () => {
      const value = {
        ...valid,
        sop_bath: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
  })
  describe('meta/profiles', () => {
    const fields = ['datetime', 'temp', 'flag']
    const schema = schemas.meta(fields, 'PROFILES')
    const valid = {
    }
    test('valid minimal config passes', () => {
      expect(validateSchema(schema, valid)).toMatchObject(valid)
    })
    test('valid full config passes', () => {
      const value = {
        accuracy: '1',
        reviewed: true,
        flagColumn: 'flag',
        sop_bath: true
      }
      expect(validateSchema(schema, value)).toMatchObject(value)
    })
    test('invalid accuracy fails', () => {
      const value = {
        ...valid,
        accuracy: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid reviewed fails', () => {
      const value = {
        reviewed: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid flagColumn fails', () => {
      const value = {
        accuracy: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
    test('invalid sop_bath fails', () => {
      const value = {
        sop_bath: 'invalid'
      }
      expect(() => validateSchema(schema, value)).toThrow()
    })
  })
})
