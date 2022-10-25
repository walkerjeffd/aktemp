const Papa = require('papaparse')
const { readFileSync } = require('fs')
const { stripBom } = require('../utils')

module.exports.readCsvFile = function (filepath) {
  const csv = readFileSync(filepath, { encoding: 'utf8' })
  const parsed = Papa.parse(stripBom(csv), {
    header: true,
    delimiter: ',',
    columns: true,
    skipEmptyLines: 'greedy'
  })
  return parsed.data
}
