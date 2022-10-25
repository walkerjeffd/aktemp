/* eslint-env jest */

const {
  isNumber,
  isString,
  isEmptyString,
  emptyStringToNull,
  convertDepthUnits
  // medianFrequency,
} = require('../utils')

describe('isNumber()', () => {
  test.each`
    value        | expected
    ${'1'}       | ${true}
    ${'1.5'}     | ${true}
    ${'1.5e-2'}  | ${true}
    ${'-5'}      | ${true}
    ${'01'}      | ${true}
    ${' 1'}      | ${true}
    ${1}         | ${true}
    ${1.5}       | ${true}
    ${1.5e-2}    | ${true}
    ${-5}        | ${true}
    ${''}        | ${false}
    ${' '}       | ${false}
    ${'text'}    | ${false}
    ${'1a'}      | ${false}
    ${'a1'}      | ${false}
    ${true}      | ${false}
    ${false}     | ${false}
    ${undefined} | ${false}
    ${null}      | ${false}
  `('\'$value\' is $expected', ({ value, expected }) => {
    expect(isNumber(value)).toEqual(expected)
  })
})

describe('isString()', () => {
  test.each`
    value        | expected
    ${''}        | ${true}
    ${' '}       | ${true}
    ${'a'}       | ${true}
    ${' a '}     | ${true}
    ${'1'}       | ${true}
    ${'true'}    | ${true}
    ${null}      | ${false}
    ${undefined} | ${false}
    ${1}         | ${false}
    ${true}      | ${false}
  `('\'$value\' is $expected', ({ value, expected }) => {
    expect(isString(value)).toEqual(expected)
  })
})

describe('isEmptyString()', () => {
  test.each`
    value        | expected
    ${''}        | ${true}
    ${' '}       | ${true}
    ${'a'}       | ${false}
    ${' a '}     | ${false}
    ${'1'}       | ${false}
    ${'true'}    | ${false}
    ${null}      | ${false}
    ${undefined} | ${false}
    ${1}         | ${false}
    ${true}      | ${false}
  `('\'$value\' is $expected', ({ value, expected }) => {
    expect(isEmptyString(value)).toEqual(expected)
  })
})

describe('emptyStringToNull()', () => {
  test.each`
    value     | expected
    ${''}     | ${null}
    ${' '}    | ${null}
    ${'true'} | ${'true'}
    ${true}   | ${true}
    ${'a'}    | ${'a'}
    ${1}      | ${1}
  `('\'$value\' is $expected', ({ value, expected }) => {
    expect(emptyStringToNull(value)).toEqual(expected)
  })
})

describe('convertDepthUnits()', () => {
  test.each`
    value  | units   | expected
    ${1}   | ${'m'}  | ${1}
    ${1e2} | ${'m'}  | ${1e2}
    ${1}   | ${'ft'} | ${0.3048}
    ${1}   | ${'cm'} | ${0.01}
    ${1}   | ${'in'} | ${0.3048 / 12}
  `('\'$value\' (\'$units\') is $expected', ({ value, units, expected }) => {
    expect(convertDepthUnits(value, units)).toBeCloseTo(expected)
  })
  test.each`
    value        | units  | expected
    ${null}      | ${'m'} | ${null}
    ${undefined} | ${'m'} | ${null}
    ${'a'}       | ${'m'} | ${null}
  `('\'$value\' (\'$units\') is $expected', ({ value, units, expected }) => {
    expect(convertDepthUnits(value, units)).toEqual(expected)
  })
  test.each`
    value  | units
    ${1}   | ${'invalid'}
    ${1}   | ${null}
    ${1}   | ${undefined}
  `('\'$value\' (\'$units\') fails', ({ value, units }) => {
    expect(() => convertDepthUnits(value, units)).toThrow()
  })
})
