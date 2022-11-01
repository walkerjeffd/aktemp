/* eslint-env jest */

const { readFileSync } = require('fs')
const path = require('path')
const {
  parseCsv
} = require('../parsers')

const { flagLabel, extractFlags } = require('../flags')

describe('flagLabel()', () => {
  test.each`
    type         | other       | expected
    ${''}        | ${''}       | ${''}
    ${null}      | ${''}       | ${''}
    ${'OOW'}     | ${''}       | ${'OOW'}
    ${'OTHER'}   | ${'custom'} | ${'OTHER [custom]'}
    ${'OTHER'}   | ${''}       | ${'OTHER [N/A]'}
    ${'OTHER'}   | ${null}     | ${'OTHER [N/A]'}
  `('[\'$type\', \'$other\'] is \'$label\'', ({ type, other, expected }) => {
    expect(flagLabel({ flag_type_id: type, flag_type_other: other })).toEqual(expected)
  })
})

describe('extractFlags()', () => {
  test.each`
    file                       | expected
    ${'empty.csv'}             | ${[]}
    ${'no-flags.csv'}          | ${[]}
    ${'all-flags.csv'}         | ${[['2012-06-27T00:00:00Z', '2012-06-27T23:00:00Z', 'X']]}
    ${'one-row-no-flag.csv'}   | ${[]}
    ${'one-row-flag.csv'}      | ${[['2012-06-27T00:00:00Z', '2012-06-27T00:00:00Z', 'X']]}
    ${'single-row-start.csv'}  | ${[['2012-06-27T00:00:00Z', '2012-06-27T00:00:00Z', 'X']]}
    ${'single-row-middle.csv'} | ${[['2012-06-27T12:00:00Z', '2012-06-27T12:00:00Z', 'X']]}
    ${'single-row-end.csv'}    | ${[['2012-06-27T23:00:00Z', '2012-06-27T23:00:00Z', 'X']]}
    ${'one-flag-start.csv'}    | ${[['2012-06-27T00:00:00Z', '2012-06-27T03:00:00Z', 'X']]}
    ${'one-flag-middle.csv'}   | ${[['2012-06-27T04:00:00Z', '2012-06-27T07:00:00Z', 'X']]}
    ${'one-flag-end.csv'}      | ${[['2012-06-27T20:00:00Z', '2012-06-27T23:00:00Z', 'X']]}
    ${'two-flags.csv'}         | ${[['2012-06-27T00:00:00Z', '2012-06-27T03:00:00Z', 'X'], ['2012-06-27T20:00:00Z', '2012-06-27T23:00:00Z', 'Y']]}
    ${'two-flags-adjacent.csv'}| ${[['2012-06-27T00:00:00Z', '2012-06-27T03:00:00Z', 'X'], ['2012-06-27T04:00:00Z', '2012-06-27T07:00:00Z', 'Y']]}
    ${'two-flags-overlap.csv'} | ${[['2012-06-27T01:00:00Z', '2012-06-27T03:00:00Z', 'X'], ['2012-06-27T04:00:00Z', '2012-06-27T05:00:00Z', 'X,Y'], ['2012-06-27T06:00:00Z', '2012-06-27T06:00:00Z', 'Y']]}
  `('$file', ({ file, expected }) => {
    const expectedFlags = expected.map(d => ({
      start_datetime: d[0],
      end_datetime: d[1],
      flag_type_id: 'OTHER',
      flag_type_other: d[2]
    }))
    const filepath = path.join(__dirname, 'files/extractFlags', file)
    const csv = readFileSync(filepath, { encoding: 'utf8' }).toString()
    const { data } = parseCsv(csv)
    const flags = extractFlags(data)
    expect(flags).toEqual(expectedFlags)
  })
})
