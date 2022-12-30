const Papa = require('papaparse')
const { luxon, formatTimestamp } = require('./time')

const hr = '# ------------------------------------------------------------------------------'

const columnLabels = {
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
    accuracy: 'Sensor Accuracy Level (1: < 0.25 degC (best); 2: < 0.5 degC; 3: > 0.5 degC (worst))',
    reviewed: 'QAQC Review Complete'
  },
  stationDailyValues: {
    date: 'Date (local timezone)',
    n_values: 'Number of measurements',
    min_temp_c: 'Minimum temperature (degC)',
    mean_temp_c: 'Mean temperature (degC)',
    max_temp_c: 'Maximum temperature (degC)',
    flag: 'QAQC flag(s)'
  },
  dailyValues: {
    series_id: 'Series ID',
    date: 'Date (local timezone)',
    n_values: 'Number of measurements',
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
    accuracy: 'Sensor Accuracy Level (1: < 0.25 degC (best); 2: < 0.5 degC; 3: > 0.5 degC (worst))',
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

function columnDescriptions (columns, defs) {
  return columns.map(d => `#     ${d}: ${defs[d]}`).join('\n')
}

function fileHeader (title, period) {
  const now = luxon.DateTime.now()
  let body = `# AKTEMP | Alaska Stream Temperature Database
# https://aktemp.uaa.alaska.edu
#
# File Type: ${title}
# Created: ${formatTimestamp(now, 'D t ZZZZ', 'US/Alaska')}`
  if (period) {
    if (period.start && !period.end) {
      body += `\n# Period: ${period.start} or later`
    } else if (period.end && !period.start) {
      body += `\n# Period: ${period.end} or earlier`
    } else if (period.start && period.end) {
      body += `\n# Period: ${period.start} to ${period.end}`
    }
  }
  return body
}

function stationsTable (stations = [], columns = Object.keys(columnLabels.stations)) {
  const descriptions = columnDescriptions(columns, columnLabels.stations)
  const rows = stations.map(d => {
    const x = { ...d }
    x.station_id = d.id
    if (columns.includes('series_start_datetime')) {
      x.series_start_datetime = formatTimestamp(x.series_start_datetime, 'D T', d.timezone)
    }
    if (columns.includes('series_end_datetime')) {
      x.series_end_datetime = formatTimestamp(x.series_end_datetime, 'D T', d.timezone)
    }
    if (columns.includes('profiles_start_date')) {
      x.profiles_start_date = formatTimestamp(x.profiles_start_date, 'D', d.timezone)
    }
    if (columns.includes('profiles_end_date')) {
      x.profiles_end_date = formatTimestamp(x.profiles_end_date, 'D', d.timezone)
    }
    return x
  })
  const table = Papa.unparse(rows, { columns })
  return `${hr}
# Stations Table
#
${descriptions}
#
${table || '# No Stations Found'}`
}

function stationDailyValuesTable (values, columns = Object.keys(columnLabels.stationDailyValues)) {
  const descriptions = columnDescriptions(columns, columnLabels.stationDailyValues)
  values = values.map(d => {
    const x = { ...d }
    if (columns.includes('date')) {
      x.date = formatTimestamp(x.date, 'yyyy-MM-dd')
    }
    return x
  })
  const table = Papa.unparse(values, { columns })
  return `${hr}
# Continuous Timeseries Daily Values
#
#     This table contains daily statistics (min/mean/max) of observed water temperature
#     computed across all timeseries at a single station. If multiple timeseries were collected
#     at different depths or using duplicate loggers then the daily values will be aggregated.
#     QAQC flags are also aggregated to daily timesteps. If one or more measurements during a
#     single day were flagged then that flag is assigned to the entire day. If more than one
#     type of flag occurred in a single day then the unique flag labels are combined into a
#     comma-separated list.
#
${descriptions}
#
${table || '# No Daily Values Found'}`
}

function seriesTable (series, columns = Object.keys(columnLabels.series)) {
  const descriptions = columnDescriptions(columns, columnLabels.series)
  const rows = series.map(d => {
    const x = { ...d }
    x.series_id = d.id
    if (columns.includes('start_datetime')) {
      x.start_datetime = formatTimestamp(x.start_datetime, 'D T', d.station_timezone)
    }
    if (columns.includes('end_datetime')) {
      x.end_datetime = formatTimestamp(x.end_datetime, 'D T', d.station_timezone)
    }
    return x
  })
  const table = Papa.unparse(rows, { columns })
  return `${hr}
# Timeseries Metadata
#
${descriptions}
#
${table || '# No Timeseries Found'}`
}

function seriesDailyValuesTable (values, columns = Object.keys(columnLabels.dailyValues)) {
  const descriptions = columnDescriptions(columns, columnLabels.dailyValues)
  values = values.map(d => {
    const x = { ...d }
    if (columns.includes('date')) {
      x.date = formatTimestamp(x.date, 'yyyy-MM-dd', x.station_timezone)
    }
    return x
  })
  const table = Papa.unparse(values, { columns })
  return `${hr}
# Continuous Timeseries Daily Values
#
#     This table contains daily statistics (min/mean/max) of observed water temperature
#     for each continuous timeseries. QAQC flags are also aggregated to daily timesteps.
#     If one or more measurements during a single day were flagged then that flag is
#     assigned to the entire day. If more than one type of flag occurred in a single day
#     then the unique flag labels are combined into a comma-separated list.
#
${descriptions}
#
${table || '# No Daily Values Found'}`
}

function seriesRawValuesTable (values, columns = Object.keys(columnLabels.rawValues)) {
  const descriptions = columnDescriptions(columns, columnLabels.rawValues)

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
# Continuous Timeseries Raw Values
#
${descriptions}
#
${table || '# No Values Found'}`
}

function seriesDiscreteValuesTable (values, columns = Object.keys(columnLabels.rawValues)) {
  const descriptions = columnDescriptions(columns, columnLabels.rawValues)

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
# Discrete Timeseries Values
#
${descriptions}
#
${table || '# No Values Found'}`
}

function seriesFlagsTable (flags, columns = Object.keys(columnLabels.flags)) {
  const descriptions = columnDescriptions(columns, columnLabels.flags)
  const rows = flags.map(d => {
    const x = { ...d }
    x.flag_id = x.id
    if (columns.includes('start_datetime')) {
      x.start_datetime = formatTimestamp(x.start_datetime, 'D T', x.station_timezone)
    }
    if (columns.includes('end_datetime')) {
      x.end_datetime = formatTimestamp(x.end_datetime, 'D T', x.station_timezone)
    }
    return x
  })
  const table = Papa.unparse(rows, { columns })
  return `${hr}
# Timeseries Flags
#
${descriptions}
#
${table || '# No Flags Found'}`
}

function profilesTable (profiles, columns = Object.keys(columnLabels.profiles)) {
  const descriptions = columnDescriptions(columns, columnLabels.profiles)
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
${table || '# No Vertical Profiles Found'}`
}

function profileValuesTable (values, columns = Object.keys(columnLabels.profileValues)) {
  const descriptions = columnDescriptions(columns, columnLabels.profileValues)
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
# Vertical Profile Values
#
${descriptions}
#
${table || '# No Profile Values Found'}`
}

function writeStationsFile (stations) {
  return `${fileHeader('Stations Metadata')}
#
${stationsTable(stations)}
  `
}

function writeStationSeriesFile (station, series, values, discrete) {
  return `${fileHeader('Station Timeseries Data')}
#
${stationsTable([station])}
#
${seriesTable(series)}
#
${stationDailyValuesTable(values)}
#
${seriesDiscreteValuesTable(discrete.map(d => ({ ...d, station_timezone: station.timezone })))}
`
}

function writeStationProfilesFile (station, profiles) {
  const rows = profiles.map(d => d.values.map(v => ({
    ...v,
    profiles_id: d.id,
    station_timezone: station.timezone
  }))).flat()
  return `${fileHeader('Station Vertical Profiles Data')}
#
${stationsTable([station])}
#
${profilesTable(profiles)}
#
${profileValuesTable(rows)}
`
}

function writeSeriesMetadataFile (series) {
  return `${fileHeader('Timeseries Metadata')}
#
${seriesTable(series)}
`
}

function writeSeriesDailyFile (series, period) {
  const rows = series.map(d => d.daily.values.map(v => ({ series_id: d.id, ...v }))).flat()
  return `${fileHeader('Continuous Timeseries Daily Values', period)}
#
${seriesTable(series)}
#
${seriesDailyValuesTable(rows)}
`
}

function writeSeriesDailyDiscreteFile (series) {
  const dailyRows = series
    .filter(d => d.interval === 'CONTINUOUS')
    .map(d => d.daily.values.map(v => ({ series_id: d.id, station_timezone: d.station_timezone, ...v })))
    .flat()
  const discreteRows = series
    .filter(d => d.interval === 'DISCRETE')
    .map(d => d.values.map(v => ({ series_id: d.id, station_timezone: d.station_timezone, ...v })))
    .flat()
  return `${fileHeader('Continuous Timeseries Daily Values and Discrete Values')}
#
${seriesTable(series)}
#
${seriesDailyValuesTable(dailyRows)}
#
${seriesDiscreteValuesTable(discreteRows)}
`
}

function writeSeriesRawFile (series) {
  const rows = series.map(d => d.values.map(v => ({
    series_id: d.id,
    station_timezone: d.station_timezone,
    ...v
  }))).flat()
  return `${fileHeader('Raw Timeseries Values')}
#
${seriesTable(series)}
#
${seriesRawValuesTable(rows)}
`
}

function writeSeriesDiscreteFile (series, period) {
  const rows = series.map(d => d.values.map(v => ({ series_id: d.id, station_timezone: d.station_timezone, ...v }))).flat()
  return `${fileHeader('Discrete Timeseries', period)}
#
${seriesTable(series)}
#
${seriesDiscreteValuesTable(rows)}
`
}

function writeSeriesFlagsFile (series) {
  const rows = series.map(d => d.flags.map(f => ({ ...f, station_timezone: d.station_timezone }))).flat()
  return `${fileHeader('Timeseries Flags')}
#
${seriesTable(series)}
#
${seriesFlagsTable(rows)}
`
}

function writeProfilesFile (profiles, period) {
  const rows = profiles.map(d => d.values.map(v => ({ profile_id: d.id, ...v }))).flat()
  return `${fileHeader('Vertical Profiles', period)}
#
${profilesTable(profiles)}
#
${profileValuesTable(rows)}
`
}

module.exports = {
  writeStationsFile,
  writeStationSeriesFile,
  writeStationProfilesFile,
  writeSeriesMetadataFile,
  writeSeriesDailyFile,
  writeSeriesDailyDiscreteFile,
  writeSeriesRawFile,
  writeSeriesDiscreteFile,
  writeSeriesFlagsFile,
  writeProfilesFile
}
