import Papa from 'papaparse'
import '../plugins/dayjs'
import dayjs from 'dayjs'
import * as chrono from 'chrono-node'

import { sensorAccuracyOptions } from '@/lib/constants'

export function isNumber (x) {
  return !(isNaN(x) || x === null || (typeof x === 'string' && x.trim() === ''))
}

export function parseCsvFile (file, skipLines = 0) {
  // if skipLines > 0, then
  //   1. parse file without headers
  //   2. remove first `skipLines` lines
  //   3. convert unnamed json arrays back to csv (first row should be header)
  //   4. parse result with header
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (fileExtension !== 'csv') {
      return reject(new Error('Invalid file type, must be a comma-separated value (CSV) file with extension \'.csv\''))
    }
    return Papa.parse(file, {
      header: skipLines === 0,
      delimiter: ',',
      download: false,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (skipLines === 0) return resolve(results)
        const csv = Papa.unparse(results.data.slice(skipLines))
        Papa.parse(csv, {
          header: true,
          delimiter: ',',
          download: false,
          skipEmptyLines: 'greedy',
          complete: (results) => {
            return resolve(results)
          },
          error: (err) => reject(err)
        })
      },
      error: (err) => reject(err)
    })
  })
}

export const sleep = async (ms) => {
  await new Promise((resolve, reject) => setTimeout(resolve, 2000))
}

// bools ----------------------------------------------------

export const parseBooleanOption = (value) => {
  if (isString(value) && value.toLowerCase() === 'true') {
    return true
  } else if (isString(value) && value.toLowerCase() === 'false') {
    return false
  } else {
    return null
  }
}
export const formatBooleanOption = (value) => {
  if (value === true) return 'TRUE'
  else if (value === false) return 'FALSE'
}

export const formatAccuracy = (value) => {
  const item = sensorAccuracyOptions.find(d => d.value === value)
  return item ? item.label : null
}

// strings --------------------------------------------------

function isString (value) {
  return typeof value === 'string' || value instanceof String
}

export const trim = (x) => {
  if (typeof x === 'string') {
    return x.trim()
  }
  return x
}

export const joinStrings = x => x.map(d => `'${d}'`).join(', ')

// flags ----------------------------------------------------

export function assignDailyFlags (values, flags) {
  values = values.slice()

  flags = flags.map(flag => {
    const label = flagLabel(flag)

    const startIndex = values.findIndex(d => d.date >= flag.start_date)
    const endIndex = values.findIndex(d => d.date >= flag.end_date)

    let flagValues
    if (startIndex >= 0 && endIndex < 0) {
      // flag ends after last value
      flagValues = values.splice(startIndex, values.length - startIndex)
    } else if (startIndex === 0 && endIndex >= 0) {
      // flag begins on or before first value
      flagValues = values.splice(startIndex, endIndex)
    } else {
      flagValues = values.splice(startIndex, endIndex - startIndex + 1)
    }
    return {
      ...flag,
      label,
      values: flagValues
    }
  })
  return { values, flags }
}

export function assignRawFlags (values, flags) {
  values = values.slice()

  if (values.length === 0) {
    return { values, flags: [] }
  }

  flags = flags.map(flag => {
    const label = flagLabel(flag)

    let flagValues = []
    if (new Date(flag.end_datetime) >= new Date(values[0].datetime) && // flag ends after first value
        new Date(flag.start_datetime) <= new Date(values[values.length - 1].datetime)) { // flag starts before last value
      const startIndex = values.findIndex(d => new Date(d.datetime) >= new Date(flag.start_datetime))
      const endIndex = values.findIndex(d => new Date(d.datetime) >= new Date(flag.end_datetime))

      if (startIndex < 0 && endIndex >= 0) {
        flagValues = values.splice(0, values.length - endIndex + 1)
      } else if (startIndex >= 0 && endIndex < 0) {
        flagValues = values.splice(startIndex, values.length - startIndex)
      } else {
        flagValues = values.splice(startIndex, endIndex - startIndex + 1)
      }
    }

    return {
      ...flag,
      label,
      values: flagValues
    }
  })

  return { values, flags }
}

export function flagLabel (flag) {
  let label = flag.flag_type_id
  if (flag.flag_type_id === 'OTHER') {
    label += ` (${flag.flag_type_other || 'N/A'})`
  }
  return label
}

// timestamps -----------------------------------------------

export function guessUtcOffset (timestamp, stationTimezone) {
  const d = parseTimestamp(timestamp, 0).tz(stationTimezone)
  if (!d.isValid()) {
    throw new Error(`Failed to guess UTC offset for timestamp (${timestamp}) at time zone (${stationTimezone})`)
  }
  return d.utcOffset() / 60
}

export function parseTimestamp (timestamp, utcOffset = 0) {
  // timestamp: string
  // utcOffset: number (hours)
  // returns dayjs object
  let x = chrono.strict.parseDate(timestamp, { timezone: 'UTC' })
  if (x === null) {
    x = chrono.strict.parseDate(timestamp.replace('2:', '3:'), { timezone: 'UTC' })
    if (x !== null) {
      x = dayjs.utc().subtract(1, 'hour').toDate()
    }
  }
  if (!x) {
    throw new Error(`Failed parse timestamp (${timestamp})`)
  }
  return dayjs(x).subtract(utcOffset, 'hours')
}

export function formatTimestamp (timestamp, format, timezone) {
  return timezone ? dayjs(timestamp).tz(timezone).format(format) : dayjs(timestamp).format(format)
}

export function emptyStringToNull (x) {
  return x === '' ? null : x
}
