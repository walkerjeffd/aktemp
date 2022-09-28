const chrono = require('chrono-node')
const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.tz.setDefault('UTC')

const { convertDepthUnits, isNumber } = require('./utils')

function chronoParseDate (value) {
  let x = chrono.strict.parseDate(value, { timezone: 'UTC' })
  if (x === null) {
    x = dayjs.utc(chrono.strict.parseDate(value.replace('2:', '3:'), { timezone: 'UTC' })).subtract(1, 'hour').toDate()
  }
  return x
}

function extractTimestamp (d, config) {
  let value = d[config.timestamp.columns[0]]
  if (config.timestamp.columns.length === 2) {
    value = `${value} ${d[config.timestamp.columns[1]]}`
  }
  return value
}

function parseTimestamp (d, config) {
  const value = extractTimestamp(d, config)
  const row = d.$row || 'N/A'

  if (!value) {
    throw new Error(`Missing timestamp on row=${row} ('${value}')`)
  }

  let parsed
  if (config.timestamp.timezone.mode === 'GUESS' || config.timestamp.timezone.mode === 'UTCOFFSET') {
    const utcOffset = config.timestamp.timezone.utcOffset
    parsed = dayjs(chronoParseDate(value)).subtract(utcOffset, 'hours')
  } else if (config.timestamp.timezone.mode === 'TIMESTAMP') {
    parsed = dayjs.utc(chronoParseDate(value))
  } else if (config.timestamp.timezone.mode === 'COLUMN') {
    const utcOffset = d[config.timestamp.timezone.column]
    parsed = dayjs.tz(chronoParseDate(value)).subtract(utcOffset, 'hours')
  }

  if (!parsed || !parsed.isValid()) {
    throw new Error(`Invalid timestamp ('${value}') on row ${row}`)
  }

  return parsed.toISOString()
}

function parseValue (d, config) {
  const value = d[config.value.column]
  if (config.value.missing.includes(value)) {
    return null
  }
  let numericValue = Number(value)
  if (!isNumber(numericValue)) {
    numericValue = null
  } else if (config.value.units === 'F') {
    numericValue = (numericValue - 32) * 5 / 9
  }
  return numericValue
}

function parseFlag (d, config) {
  if (!config.value.flagColumn) return null
  return d[config.value.flagColumn]
}

function parseDepth (d, config) {
  if (config.depth.mode !== 'COLUMN') return null
  const value = d[config.depth.column]

  const numericValue = Number(value)

  if (!isFinite(numericValue)) {
    throw new Error(`Invalid depth value at row ${d.$row} ('${value}')`)
  }

  return convertDepthUnits(numericValue, config.depth.units)
}

module.exports = {
  parseTimestamp,
  parseValue,
  parseFlag,
  parseDepth,
  extractTimestamp
}
