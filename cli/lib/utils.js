const debug = require('../debug')
const columnify = require('columnify')
const { readFileSync } = require('fs')
const { parseCsv } = require('aktemp-utils/parsers')

exports.printTable = function (data, columns, options) {
  if (data.length > 0 && !columns) {
    columns = Object.keys(data[0])
  }
  const table = columnify(data, {
    ...options,
    columns,
    columnSplitter: ' | '
  })
  console.log(table)
}

exports.readLocalJsonFile = function (filepath) {
  debug('reading local json file:', filepath)
  try {
    return JSON.parse(readFileSync(filepath))
  } catch (err) {
    console.error(err)
    throw new Error(`failed to parse JSON file ('${filepath}')`)
  }
}

exports.readLocalCsvFile = async function (filepath, skipLines) {
  debug('readLocalCsvFile:', filepath)
  const csv = readFileSync(filepath).toString()
  try {
    const parsed = parseCsv(csv, skipLines)
    return { data: parsed.data, fields: parsed.meta.fields }
  } catch (err) {
    console.log(err)
    throw new Error(`failed to parse CSV file ('${filepath}'), error: ${err.toString()}`)
  }
}
