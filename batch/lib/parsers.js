const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.tz.setDefault('UTC')

const { convertDepthUnits } = require('./utils')

function parseTimestamp (d, config) {
  let value = d[config.timestamp.columns[0]]
  if (config.timestamp.columns.length === 2) {
    value = `${value} ${d[config.timestamp.columns[1]]}`
  }
  const row = d.$row || 'N/A'

  if (!value) {
    throw new Error(`Invalid timestamp on row=${row} ('${value}')`)
  }

  let parsed
  if (config.timestamp.timezone.mode === 'timestamp') {
    parsed = dayjs(value)
  } else if (config.timestamp.timezone.mode === 'utcOffset') {
    const utcOffset = Number(config.timestamp.timezone.utcOffset)
    parsed = dayjs(value).utc(true)
    parsed = parsed.subtract(utcOffset, 'hours')
  } else if (config.timestamp.timezone.mode === 'column') {
    const utcOffset = Number(d[config.timestamp.timezone.column])
    parsed = dayjs(value).utc(true)
    parsed = parsed.subtract(utcOffset, 'hours')
  }

  if (!parsed.isValid()) {
    throw new Error(`Invalid timestamp on row=${row} ('${value}')`)
  }

  return parsed.toISOString()
}

function parseValue (d, config) {
  const value = d[config.value.column]
  const row = d.$row
  if (config.value.missing.includes(value)) {
    return null
  }
  let numericValue = Number(value)
  if (!isFinite(numericValue)) {
    throw new Error(`Invalid temperature value at row ${row} ('${value}')`)
  }
  if (config.value.units === 'F') {
    numericValue = (numericValue - 32) * 5 / 9
  }
  return numericValue
}

function parseFlag (d, config) {
  if (!config.meta.flagColumn) return null
  return d[config.meta.flagColumn]
}

function parseDepth (d, config) {
  if (config.depth.mode !== 'column') return null
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
  parseDepth
}
