const Papa = require('papaparse')
const { luxon, formatTimestamp } = require('./time')

const hr = '# ------------------------------------------------------------------------------'

const columnDefs = {
  stations: {
    station_id: 'Station ID',
    organization_code: 'Organization Code',
    code: 'Station Code',
    latitude: 'Latitude (WGS84)',
    longitude: 'Longitude (WGS84)',
    timezone: 'Local timezone',
    description: 'Station Description',
    waterbody_name: 'Waterbody name',
    waterbody_type: 'Waterbody type',
    placement: 'Placement',
    mixed: 'Fully mixed',
    active: 'Active station',
    reference: 'Reference URL',
    private: 'Private',
    series_count: 'Number of timeseries',
    series_start_datetime: 'First timeseries timestamp (local timezone)',
    series_end_datetime: 'Last timeseries timestamp (local timezone)',
    series_count_days: 'Number of days between first and last timeseries dates',
    profiles_count: 'Number of vertical profiles',
    profiles_start_date: 'First date of vertical profiles (local timezone)',
    profiles_end_date: 'Last date of vertical profiles (local timezone)'
  },
  series: {
    series_id: 'Timeseries ID',
    organization_code: 'Organization Code',
    station_id: 'Station ID',
    station_code: 'Station Code',
    station_timezone: 'Station Timezone',
    start_datetime: 'Start Timestamp (local timezone)',
    end_datetime: 'End Timestamp (local timezone)',
    interval: 'Interval (Continuous or Discrete)',
    frequency: 'Frequency (minutes)',
    depth_category: 'Depth category',
    depth_m: 'Depth (m)',
    sop_bath: 'Sensor checked using Pre/Post Bath according to SOP',
    accuracy: 'Sensor Accuracy Level (1 = < 0.25 degC (best); 2: < 0.5 degC; 3: > 0.5 degC (worst))',
    reviewed: 'QAQC Review Complete'
  },
  dailyValues: {
    series_id: 'Series ID',
    date: 'Date (local timezone)',
    n: 'Number of measurements',
    min_temp_c: 'Minimum temperature (degC)',
    mean_temp_c: 'Mean temperature (degC)',
    max_temp_c: 'Maximum temperature (degC)',
    flag: 'QAQC flag(s)'
  },
  rawValues: {
    series_id: 'Series ID',
    datetime_utc: 'Timestamp (UTC)',
    datetime_local: 'Timestamp (local timezone)',
    temp_c: 'Temperature (degC)',
    flag: 'QAQC flag(s)'
  },
  profiles: {
    profile_id: 'Profile ID',
    organization_code: 'Organization Code',
    station_id: 'Station ID',
    station_code: 'Station Code',
    station_timezone: 'Station Timezone',
    date: 'Date (local timezone)',
    accuracy: 'Sensor Accuracy Level (1 = < 0.25 degC (best); 2: < 0.5 degC; 3: > 0.5 degC (worst))',
    reviewed: 'QAQC Review Complete'
  },
  profileValues: {
    profile_id: 'Profile ID',
    datetime_utc: 'Timestamp (UTC)',
    datetime_local: 'Timestamp (local timezone)',
    depth_m: 'Depth (m)',
    temp_c: 'Temperature (degC)'
  },
  flags: {
    flag_id: 'Flag ID',
    series_id: 'Series ID',
    start_datetime: 'Start Timestamp (local timezone)',
    end_datetime: 'End Timestamp (local timezone)',
    flag_type_id: 'Flag Type',
    flag_type_other: 'Flag (Other)'
  }
}

function writeColumnDescriptions (columns, defs) {
  return columns.map(d => `#     ${d}: ${defs[d]}`).join('\n')
}

exports.writeFileHeader = function (tz = 'US/Alaska') {
  const now = luxon.DateTime.now()
  return `# AKTEMP | Alaska Stream Temperature Database
# https://aktemp.uaa.alaska.edu
#
# File created: ${formatTimestamp(now, 'D t ZZZZ', tz)}`
}

exports.writeStationsTable = function (stations = [], columns = Object.keys(columnDefs.stations)) {
  const descriptions = writeColumnDescriptions(columns, columnDefs.stations)
  const rows = stations.map(d => {
    const x = { ...d }
    x.station_id = d.id
    if (columns.includes('series_start_datetime')) {
      x.series_start_datetime = formatTimestamp(x.series_start_datetime.toISOString(), 'D T', d.timezone)
    }
    if (columns.includes('series_end_datetime')) {
      x.series_end_datetime = formatTimestamp(x.series_end_datetime.toISOString(), 'D T', d.timezone)
    }
    if (columns.includes('profiles.start_date')) {
      x.profiles.start_date = formatTimestamp(x.profiles.start_date, 'D', d.timezone)
    }
    if (columns.includes('profiles.end_date')) {
      x.profiles.end_date = formatTimestamp(x.profiles.end_date, 'D', d.timezone)
    }
    return x
  })
  const table = Papa.unparse(rows, { columns })
  return `${hr}
# Station Table
#
${descriptions}
#
${table}`
}

exports.writeSeriesTable = function (series, columns = Object.keys(columnDefs.series)) {
  const descriptions = writeColumnDescriptions(columns, columnDefs.series)
  const rows = series.map(d => {
    const x = { ...d }
    x.series_id = d.id
    if (columns.includes('start_datetime')) {
      x.start_datetime = formatTimestamp(x.start_datetime.toISOString(), 'D T', d.station_timezone)
    }
    if (columns.includes('end_datetime')) {
      x.end_datetime = formatTimestamp(x.end_datetime.toISOString(), 'D T', d.station_timezone)
    }
    return x
  })
  const table = Papa.unparse(rows, { columns })
  return `${hr}
# Timeseries Metadata
#
${descriptions}
#
${table}`
}

exports.writeSeriesDailyValuesTable = function (values, columns = Object.keys(columnDefs.dailyValues)) {
  const descriptions = writeColumnDescriptions(columns, columnDefs.dailyValues)
  values = values.map(d => {
    const x = { ...d }
    if (columns.includes('date')) {
      x.date = formatTimestamp(x.date, 'yyyy-MM-dd')
    }
    return x
  })
  const table = Papa.unparse(values, { columns })
  return `${hr}
# Continuous Daily Values
#
#     This table contains daily statistics (min/mean/max) of observed water temperature
#     for each continuous timeseries. QAQC flags are also aggregated to daily timesteps.
#     If one or more measurements during a single day were flagged then that flag is
#     assigned to the entire day. If more than one type of flag occurred in a single day
#     then the unique flag labels are combined into a comma-separated list.
#
${descriptions}
#
${table}`
}

exports.writeSeriesRawValuesTable = function (values, columns = Object.keys(columnDefs.rawValues)) {
  const descriptions = writeColumnDescriptions(columns, columnDefs.rawValues)

  values = values.map(d => {
    const x = { ...d }
    if (columns.includes('datetime_utc')) {
      x.datetime_utc = formatTimestamp(x.datetime, 'ISO', 'UTC')
    }
    if (columns.includes('datetime_local')) {
      x.datetime_local = formatTimestamp(x.datetime, 'D T', x.station_timezone)
    }
    return x
  })

  const table = Papa.unparse(values, { columns })
  return `${hr}
# Continuous Timeseries Values
#
${descriptions}
#
${table}`
}

exports.writeProfilesTable = function (profiles, columns = Object.keys(columnDefs.profiles)) {
  const descriptions = writeColumnDescriptions(columns, columnDefs.profiles)
  const rows = profiles.map(d => {
    const x = { ...d }
    x.profile_id = d.id
    if (columns.includes('start_datetime')) {
      x.start_datetime = formatTimestamp(x.start_datetime, 'D T', d.timezone)
    }
    if (columns.includes('end_datetime')) {
      x.end_datetime = formatTimestamp(x.end_datetime, 'D T', d.timezone)
    }
    return x
  })
  const table = Papa.unparse(rows, { columns })
  return `${hr}
# Vertical Profiles Metadata
#
${descriptions}
#
${table}`
}

exports.writeProfileValuesTable = function (values, columns = Object.keys(columnDefs.profileValues)) {
  const descriptions = writeColumnDescriptions(columns, columnDefs.profileValues)
  values = values.map(d => {
    const x = { ...d }
    // console.log(typeof x.datetime)
    // console.log(x.datetime, x.station_timezone, luxon.DateTime.fromISO(x.datetime, { zone: 'UTC' }).toISO())
    if (columns.includes('datetime_utc')) {
      x.datetime_utc = formatTimestamp(x.datetime, 'ISO', 'UTC')
    }
    if (columns.includes('datetime_local')) {
      x.datetime_local = formatTimestamp(x.datetime, 'D T', x.station_timezone)
    }
    return x
  })
  const table = Papa.unparse(values, { columns })
  return `${hr}
# Vertical Profile Values
#
${descriptions}
#
${table}`
}
