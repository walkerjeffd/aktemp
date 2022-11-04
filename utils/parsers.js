const debug = require('./debug')
const Papa = require('papaparse')
const d3 = require('d3')

const {
  getTimestampString,
  convertUtcOffsetToTimezone,
  parseTimestampString,
  adjustTimestampToUtc,
  getLocalUtcOffsetTimezone,
  luxon
} = require('./time')
const {
  convertDepthUnits,
  isString,
  isEmptyString,
  isNumber,
  emptyStringToNull,
  stripBom,
  medianFrequency
} = require('./utils')
const { extractFlags } = require('./flags')

function parseBoolean (value, default_ = null) {
  if (typeof value === 'boolean') return value

  if (isString(value) && value.trim().toLowerCase() === 'true') {
    return true
  } else if (isString(value) && value.trim().toLowerCase() === 'false') {
    return false
  } else if (isEmptyString(value) || value === undefined || value === null) {
    return default_
  } else {
    throw new Error(`invalid boolean string ('${value}')`)
  }
}

function parseUtcOffset (row, column) {
  const value = row[column] || ''
  const utcOffset = parseInt(value.replace('UTC', ''))
  return convertUtcOffsetToTimezone(utcOffset)
}

function parseStationCode (d, config) {
  if (!d) return null
  if (config.station_code) return config.station_code
  if (!config.station_column) return null

  return emptyStringToNull(d[config.station_column])
}

function parseTimestamp (d, config) {
  const value = getTimestampString(d, config.datetime_column, config.time_column)
  const parsed = parseTimestampString(value, config.datetime_format)
  let timezone
  if (config.timezone_column) {
    timezone = parseUtcOffset(d, config.timezone_column)
  } else {
    timezone = config.timezone
  }
  const timestamp = adjustTimestampToUtc(parsed, timezone)
  if (!timestamp.isValid) {
    throw new Error(`Failed to parse timestamp ('${value}') [row: ${d.$row}]`)
  }
  return timestamp.toUTC().toISO()
}

function parseTemperature (d, config) {
  const value = d[config.temperature_column]
  if (config.temperature_missing.includes(value.trim()) || !value.trim()) {
    return null
  }
  let numericValue = parseFloat(value)
  if (!isNumber(numericValue)) {
    numericValue = null
  } else if (config.temperature_units === 'F') {
    numericValue = (numericValue - 32) * 5 / 9
  }
  return numericValue
}

function parseFlag (d, config) {
  if (!d || !config || !config.flag_column) return null
  return emptyStringToNull(d[config.flag_column])
}

function parseDepth (d, config) {
  if (!config.depth_column) {
    if (isNumber(config.depth_value)) {
      return convertDepthUnits(config.depth_value, config.depth_units)
    } else {
      return null
    }
  }

  const value = d[config.depth_column]
  const parsed = parseFloat(value)

  if (!isNumber(parsed)) {
    if (config.file_type === 'PROFILES') {
      throw new Error(`Invalid depth value ('${value}') at row ${d.$row} `)
    } else {
      return null
    }
  }

  return convertDepthUnits(parsed, config.depth_units)
}

function parseRow (d, config) {
  const result = {
    station_code: parseStationCode(d, config),
    value: parseTemperature(d, config),
    depth_m: parseDepth(d, config)
  }
  if (config.file_type === 'SERIES') {
    result.datetime = parseTimestamp(d, config)
    result.flag = parseFlag(d, config)
  } else if (config.file_type === 'PROFILES') {
    result.datetime = parseTimestamp(d, config)
    // result.datetime = getTimestampString(d, config.datetime_column, config.time_column)
  }
  return result
}

function parseRows (rows, config) {
  if (!rows || rows.length === 0) return []

  config = {
    ...config,
    temperature_missing: config.temperature_missing
      ? config.temperature_missing.split(',').map(d => d.trim())
      : []
  }

  const parsed = rows.map(d => parseRow(d, config))
  let filtered = parsed.filter(d => d.datetime !== null && d.value !== null && d.station_code !== null)
  if (config.file_type === 'PROFILES') {
    filtered = filtered.filter(d => d.depth_m !== null)
  }

  return filtered
}

function parseCsv (csv, skipLines = 0, ignoreErrors = false) {
  // if skipLines > 0, then
  //   1. parse file without headers
  //   2. remove first `skipLines` lines
  //   3. convert unnamed json arrays back to csv (first row should be header)
  //   4. parse result with header
  csv = stripBom(csv)
  let results
  try {
    if (skipLines > 0) {
      const unnamedRows = Papa.parse(csv, {
        header: false,
        delimiter: ',',
        columns: true,
        skipEmptyLines: 'greedy'
      })
      csv = Papa.unparse(unnamedRows.data.slice(skipLines))
    }
    results = Papa.parse(csv, {
      header: true,
      delimiter: ',',
      columns: true,
      skipEmptyLines: 'greedy'
    })
  } catch (err) {
    console.error(err)
    throw new Error('Failed to parse csv file (unknown error)')
  }

  if (!ignoreErrors) {
    if (results.errors.length > 0) {
      const err = results.errors[0]
      let message
      if (err.row) {
        message = `Error at row ${err.row + 1} (${err.message})`
      } else {
        message = err.message
      }
      if (results.errors.length === 2) {
        message += ' (and 1 more error)'
      } else if (results.errors.length > 2) {
        message += ` (and ${results.errors.length - 1} more errors)`
      }
      throw new Error(message)
    } else if (!results.meta.fields.every(d => d.length > 0)) {
      const index = results.meta.fields.findIndex(d => d.length === 0) + 1
      throw new Error(`File contains unnamed column (column ${index}). All columns must have a name.`)
    }
  }
  return results
}

function parseSeriesFile (rows, config, stations) {
  debug(`parseSeriesFile(): parsing rows (n=${rows.length})`)
  debug('parseSeriesFile(): config ->')
  debug(config)
  const values = parseRows(rows, config)
  debug(`parseSeriesFile(): parsed rows (n=${values.length})`)

  debug('parseSeriesFile(): grouping series by station_code, depth_m')
  const series = Array.from(
    d3.group(values, d => d.station_code, d => d.depth_m),
    ([key1, value]) => Array.from(value, ([key2, value]) => ({
      station_code: key1,
      depth_m: key2,
      values: value.map(({ station_code, depth_m, ...d }) => d) // eslint-disable-line
        .sort((a, b) => d3.ascending(a.datetime, b.datetime))
    }))
  ).flat()
  debug(`parseSeriesFile(): returned ${series.length} series -> [station_code, depth_m, values.length]`)
  debug(series.map(d => [d.station_code, d.depth_m, d.values.length]))

  series.forEach(s => {
    debug(`parseSeriesFile(): fetching station ('${s.station_code}')`)
    const station = stations.find(d => d.code === s.station_code)
    if (!station) throw new Error(`Station not found (code=${s.station_code})`)
    s.station_id = station.id

    if (config.timezone === 'LOCAL' && s.values.length > 0) {
      if (config.interval === 'CONTINUOUS') {
        debug(`parseSeriesFile(): getting local utc offset of first timestamp ('${s.values[0].datetime}') for station ('${station.code}', tz=${station.timezone})`)
        const timezone = getLocalUtcOffsetTimezone(s.values[0].datetime, 'ISO', station.timezone)
        debug(`parseSeriesFile(): adjust timestamps to local tz (${timezone}) for station ('${station.code}', tz=${station.timezone})`)
        s.values.forEach(v => {
          v.datetime = adjustTimestampToUtc(parseTimestampString(v.datetime, 'ISO'), timezone).toUTC().toISO()
        })
      } else if (config.interval === 'DISCRETE' && s.values.length > 0) {
        debug(`parseSeriesFile(): adjusting timestamps to local tz of station ('${station.code}', tz=${station.timezone})`)
        s.values.forEach((v, i) => {
          const local = luxon.DateTime.fromISO(v.datetime).setZone(station.timezone, { keepLocalTime: true })
          if (i === 0) {
            debug(local)
          }
          if (!local.isValid) {
            throw new Error(`Failed to convert timestamp ('${v.datetime}', format='${config.datetime_format}') to station timezone ('${station.timezone}')`)
          }
          v.datetime = local.toUTC().toISO()
        })
      } else if (s.values.length > 0) {
        throw new Error('Unexpected error: missing or invalid `interval` (expected \'CONTINUOUS\' or \'DISCRETE\')')
      }
    }
    s.flags = extractFlags(s.values)
    s.values = s.values.map(({ flag, ...d }) => d)

    const datetimes = s.values.map(d => d.datetime)
    const datetimeExtent = d3.extent(datetimes)

    s.depth_category = config.depth_category
    s.start_datetime = datetimeExtent[0]
    s.end_datetime = datetimeExtent[1]
    s.interval = config.interval
    if (s.interval === 'CONTINUOUS') {
      s.frequency = medianFrequency(datetimes)
    }
    s.reviewed = config.reviewed
    s.accuracy = config.accuracy
    s.sop_bath = config.sop_bath
  })

  return series
}

function parseProfilesFile (rows, config, stations) {
  debug(`parseProfilesFile(): parsing rows (n=${rows.length})`)
  debug('parseProfilesFile(): config ->')
  debug(config)
  const values = parseRows(rows, config)
  debug(`parseProfilesFile(): parsed rows (n=${values.length}), first ->`)
  if (values.length > 0) {
    debug(values[0])
  } else {
    debug(null)
  }

  debug('parseProfilesFile(): grouping profiles by station_code')
  const profilesByStation = Array.from(
    d3.group(values, d => d.station_code),
    ([key, value]) => ({
      station_code: key,
      values: value
    })
  )
  debug(`parseProfilesFile(): returned ${profilesByStation.length} station groups -> [station_code, values.length]`)
  debug(profilesByStation.map(d => [d.station_code, d.values.length]))

  const profiles = profilesByStation.map((p) => { // eslint-disable-line
    debug(`parseProfilesFile(): fetching station ('${p.station_code}')`)
    const station = stations.find(d => d.code === p.station_code)
    if (!station) throw new Error(`Station not found (code=${p.station_code})`)

    if (config.timezone === 'LOCAL' && p.values.length > 0) {
      debug(`parseProfilesFile(): adjusting timestamps to local tz of station ('${station.code}', tz=${station.timezone})`)
      p.values.forEach((v, i) => {
        const local = luxon.DateTime.fromISO(v.datetime).setZone(station.timezone, { keepLocalTime: true })
        if (i === 0) {
          debug(local)
        }
        if (!local.isValid) {
          throw new Error(`Failed to convert timestamp ('${v.datetime}', format='${config.datetime_format}') to station timezone ('${station.timezone}')`)
        }
        v.datetime = local.toUTC().toISO()
      })
    }

    debug('parseProfilesFile(): setting date property based on local timezone')
    p.values.forEach((v, i) => {
      const local = luxon.DateTime.fromISO(v.datetime).setZone(station.timezone)
      v.date = local.toFormat('yyyy-MM-dd')
    })

    return Array.from(
      d3.group(p.values, d => d.date),
      ([key, value]) => ({
        station_id: station.id,
        station_code: station.code,
        date: key,
        accuracy: config.accuracy,
        reviewed: config.reviewed,
        values: value.map(({ date, station_code, ...d }) => d) // eslint-disable-line
      })
    )
  }).flat()
  debug(profiles)

  return profiles
}

module.exports = {
  parseBoolean,
  parseUtcOffset,
  parseTimestamp,
  parseTemperature,
  parseFlag,
  parseDepth,
  parseRow,
  parseRows,
  parseCsv,
  parseSeriesFile,
  parseProfilesFile
}
