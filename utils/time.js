// const debug = require('./debug')
const luxon = require('luxon')

const { DateTime, Settings } = luxon
Settings.defaultZone = 'UTC'

const { fileTimezoneOptions } = require('./constants')
const validUtcOffsetTimezones = fileTimezoneOptions.map(d => d.value)
  .filter(d => d.startsWith('UTC'))

exports.luxon = luxon

const dateFormats = exports.dateFormats = [
  'yy-M-d',
  'M/d/yy',
  'MMMM d, yy',
  'MMM d, yy',
  'd-MMMM-yy',
  'd-MMM-yy'
]

const timeFormats = exports.timeFormats = [
  '',
  'H:mm',
  'H:mm:ss',
  'H:mm:ss.u',
  'h:mm a',
  'h:mm:ss a',
  'h:mm:ss.u a'
]

const datetimeFormats = exports.datetimeFormats = dateFormats.map(d => {
  return timeFormats.map(t => {
    if (!t) return [d]
    return [d, t]
  })
}).flat()

exports.formatTimestamp = function (value, format, tz) {
  if (!value) return ''
  if (typeof value === 'string') {
    if (value.length > 10) {
      value = DateTime.fromISO(value, { zone: 'UTC' })
    } else {
      value = DateTime.fromISO(value, { zone: tz })
    }
  } else if (value instanceof Date) {
    value = DateTime.fromJSDate(value)
  }
  if (!value.isValid) return 'Invalid Timestamp'
  if (tz) {
    value = value.setZone(tz)
  }
  if (format === 'ISO') return value.toISO()
  return value.toFormat(format)
}

exports.getTimestampString = function (row, datetimeColumn, timeColumn) {
  let timestamp
  if (!datetimeColumn) {
    throw new Error('Missing datetime column')
  } else if (!timeColumn) {
    timestamp = row[datetimeColumn].toString().trim()
    if (!timestamp) throw new Error(`Missing datetime in column '${datetimeColumn}'`)
  } else {
    const date = row[datetimeColumn].toString().trim()
    const time = row[timeColumn].toString().trim()
    if (!date) throw new Error(`Missing date in column '${datetimeColumn}'`)
    if (!time) throw new Error(`Missing time in column '${timeColumn}'`)
    timestamp = `${date} ${time}`
  }
  return timestamp
}

const parseTimestampString = exports.parseTimestampString = function (value, format) {
  // debug('parseTimestampString()', value, format)
  let parsed
  if (format === 'ISO') {
    parsed = DateTime.fromISO(value.replace(' ', 'T'), { zone: 'UTC' })
  } else {
    parsed = DateTime.fromFormat(value.replace('Z', '+0'), format, { zone: 'UTC' })
  }
  if (!parsed || !parsed.isValid) {
    throw new Error(`Failed to parse timestamp ('${value}', format='${format}')`)
  } else if (parsed > DateTime.now()) {
    throw new Error(`Parsed timestamp ('${value}', format='${format}') is in the future ('${parsed.toISO()}')`)
  }
  return parsed
}

const convertUtcOffsetToTimezone = exports.convertUtcOffsetToTimezone = function (utcOffset) {
  const value = parseInt(utcOffset)
  const tz = value === 0 ? 'UTC' : `UTC${value}`
  if (!validUtcOffsetTimezones.includes(tz)) {
    const options = validUtcOffsetTimezones.map(d => d === 'UTC' ? '0' : d.replace('UTC', '')).join(',')
    throw new Error(`Invalid UTC offset ('${utcOffset}'), must be one of [${options}]`)
  }
  return tz
}

exports.adjustTimestampToUtc = function (value, timezone) {
  if (!timezone || timezone === 'NONE' || timezone === 'LOCAL') return value
  if (!value.isValid) {
    throw new Error(`Failed to set timezone, timestamp is invalid ('${value.toString()}')`)
  }
  const result = value.setZone(timezone, { keepLocalTime: true }).setZone('UTC')
  if (!result || !result.isValid) {
    throw new Error(`Failed to set timezone ('${value.toString()}', tz='${timezone}')`)
  }

  return result
}

exports.countDays = function (startTimestamp, endTimestamp) {
  if (!startTimestamp || !endTimestamp) return null
  if (typeof startTimestamp === 'string') {
    startTimestamp = DateTime.fromISO(startTimestamp, { zone: 'UTC' })
  } else if (startTimestamp instanceof Date) {
    startTimestamp = DateTime.fromJSDate(startTimestamp, { zone: 'UTC' })
  }
  if (typeof endTimestamp === 'string') {
    endTimestamp = DateTime.fromISO(endTimestamp, { zone: 'UTC' })
  } else if (endTimestamp instanceof Date) {
    endTimestamp = DateTime.fromJSDate(endTimestamp, { zone: 'UTC' })
  }
  if (!startTimestamp.isValid || !endTimestamp.isValid) return null
  return startTimestamp <= endTimestamp
    ? Math.floor(endTimestamp.diff(startTimestamp, 'days').as('days')) + 1
    : Math.floor(endTimestamp.diff(startTimestamp, 'days').as('days')) - 1
}

exports.getLocalUtcOffsetTimezone = function (timestamp, format, timezone) {
  if (!timezone) {
    throw new Error('Missing timezone for getting local UTC offset')
  }
  const parsed = parseTimestampString(timestamp, format)
  if (!parsed.isValid) {
    throw new Error(`Failed to parse first timestamp ('${timestamp}', format='${format}')`)
  }
  const local = parsed.setZone(timezone, { keepLocalTime: true })
  if (!local.isValid) {
    throw new Error(`Failed to convert first timestamp ('${timestamp}', format='${format}') to timezone ('${timezone}')`)
  }
  return convertUtcOffsetToTimezone(local.offset / 60)
}

exports.guessDatetimeFormat = function (timestamp) {
  if (!timestamp) return null

  if (DateTime.fromISO(timestamp.replace(' ', 'T'), { zone: 'UTC' }).isValid) return 'ISO'

  return datetimeFormats.find(d => DateTime.fromFormat(timestamp.replace('Z', '+0'), d.join(' '), { zone: 'UTC' }).isValid)
}
