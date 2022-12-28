import Vue from 'vue'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import { luxon, formatTimestamp } from 'aktemp-utils/time'

const hr = '# ------------------------------------------------------------------------------'

const columnDefs = {
  stations: {
    id: {
      label: 'Station ID'
    },
    organization_code: {
      label: 'Organization Code'
    },
    code: {
      label: 'Station Code'
    },
    latitude: {
      label: 'Latitude (WGS84)'
    },
    longitude: {
      label: 'Longitude (WGS84)'
    },
    timezone: {
      label: 'Local timezone'
    },
    description: {
      label: 'Station Description'
    },
    waterbody_name: {
      label: 'Waterbody name'
    },
    waterbody_type: {
      label: 'Waterbody type'
    },
    placement: {
      label: 'Placement'
    },
    mixed: {
      label: 'Fully mixed'
    },
    active: {
      label: 'Active station'
    },
    reference: {
      label: 'Reference URL'
    },
    private: {
      label: 'Private'
    },
    series_count: {
      label: 'Number of timeseries'
    },
    series_start_datetime: {
      label: 'First timeseries timestamp (local timezone)',
      timeFormat: 'FFF'
    },
    series_end_datetime: {
      label: 'Last timeseries timestamp (local timezone)',
      timeFormat: 'FFF'
    },
    series_count_days: {
      label: 'Number of days between first and last timeseries dates'
    },
    profiles_count: {
      label: 'Number of vertical profiles'
    },
    profiles_start_date: {
      label: 'First date of vertical profiles (local timezone)',
      timeFormat: 'DD'
    },
    profiles_end_date: {
      label: 'Last date of vertical profiles (local timezone)',
      timeFormat: 'DD'
    }
  },
  series: {
    id: {
      label: 'Timeseries ID'
    },
    organization_code: {
      label: 'Organization Code'
    },
    station_id: {
      label: 'Station ID'
    },
    station_code: {
      label: 'Station Code'
    },
    station_timezone: {
      label: 'Station Timezone'
    },
    start_datetime: {
      label: 'Start Timestamp (local timezone)'
    },
    end_datetime: {
      label: 'End Timestamp (local timezone)'
    },
    interval: {
      label: 'Interval (Continuous or Discrete)'
    },
    frequency: {
      label: 'Frequency (minutes)'
    },
    depth_category: {
      label: 'Depth category'
    },
    depth_m: {
      label: 'Depth (m)'
    },
    sop_bath: {
      label: 'Sensor checked using Pre/Post Bath according to SOP'
    },
    accuracy: {
      label: 'Sensor Accuracy Level (1 = < 0.25 degC (best); 2: < 0.5 degC; 3: > 0.5 degC (worst))'
    },
    reviewed: {
      label: 'QAQC Review Complete'
    }
  },
  dailyValues: {
    series_id: {
      label: 'Series ID'
    },
    date: {
      label: 'Date (local timezone)'
    },
    n_values: {
      label: 'Number of measurements'
    },
    min_temp_c: {
      label: 'Minimum temperature (degC)'
    },
    mean_temp_c: {
      label: 'Mean temperature (degC)'
    },
    max_temp_c: {
      label: 'Maximum temperature (degC)'
    },
    flag: {
      label: 'QAQC flag(s)'
    }
  },
  rawValues: {
    series_id: {
      label: 'Series ID'
    },
    datetime_utc: {
      label: 'Timestamp (UTC)'
    },
    datetime_local: {
      label: 'Timestamp (local timezone)'
    },
    temp_c: {
      label: 'Temperature (degC)'
    },
    flag: {
      label: 'QAQC flag(s)'
    }
  },
  profiles: {
    id: {
      label: 'Profile ID'
    },
    organization_code: {
      label: 'Organization Code'
    },
    station_id: {
      label: 'Station ID'
    },
    station_code: {
      label: 'Station Code'
    },
    station_timezone: {
      label: 'Station Timezone'
    },
    date: {
      label: 'Date (local timezone)'
    },
    accuracy: {
      label: 'Sensor Accuracy Level (1 = < 0.25 degC (best); 2: < 0.5 degC; 3: > 0.5 degC (worst))'
    },
    reviewed: {
      label: 'QAQC Review Complete'
    }
  },
  profileValues: {
    profile_id: {
      label: 'Profile ID'
    },
    datetime: {
      label: 'Timestamp (local timezone)'
    },
    depth_m: {
      label: 'Depth (m)'
    },
    temp_c: {
      label: 'Temperature (degC)'
    }
  },
  flags: {
    id: {
      label: 'Flag ID'
    },
    series_id: {
      label: 'Series ID'
    },
    start_datetime: {
      label: 'Start Timestamp (local timezone)'
    },
    end_datetime: {
      label: 'End Timestamp (local timezone)'
    },
    flag_type_id: {
      label: 'Flag Type'
    },
    flag_type_other: {
      label: 'Flag (Other)'
    }
  }
}

function fileHeader () {
  const now = luxon.DateTime.now()
  return `# AKTEMP | Alaska Stream Temperature Database
# File downloaded: ${formatTimestamp(now, 'D t ZZZZ', 'local')}`
}

function stationsTable (stations = [], columns = Object.keys(columnDefs.stations)) {
  const descriptions = columns.map(d => {
    return `#     ${d}: ${columnDefs.stations[d].label}`
  })
  const rows = stations.map(d => {
    const x = { ...d }
    if (columns.includes('series_start_datetime')) {
      x.series_start_datetime = formatTimestamp(x.series_start_datetime, 'D T', d.timezone)
    }
    if (columns.includes('series_end_datetime')) {
      x.series_end_datetime = formatTimestamp(x.series_end_datetime, 'D T', d.timezone)
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
${descriptions.join('\n')}
#
${table}`
}

function seriesTable (series, columns = Object.keys(columnDefs.series)) {
  const descriptions = columns.map(d => {
    return `#     ${d}: ${columnDefs.series[d].label}`
  })
  const rows = series.map(d => {
    const x = { ...d }
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
# Timeseries Metadata Table
${descriptions.join('\n')}
#
${table}`
}

function profilesTable (profiles, columns = Object.keys(columnDefs.profiles)) {
  const descriptions = columns.map(d => {
    return `#     ${d}: ${columnDefs.profiles[d].label}`
  })
  const table = Papa.unparse(profiles, { columns })
  return `${hr}
# Vertical Profiles Metadata Table
${descriptions.join('\n')}
#
${table}`
}

function profilesValuesTable (values, columns = Object.keys(columnDefs.profileValues)) {
  const descriptions = columns.map(d => {
    return `#     ${d}: ${columnDefs.profileValues[d].label}`
  })
  const table = Papa.unparse(values, { columns })
  return `${hr}
# Vertical Profiles Values Table
${descriptions.join('\n')}
#
${table}`
}

function dailyValuesTable (values, columns = Object.keys(columnDefs.dailyValues)) {
  const descriptions = columns.map(d => {
    return `#     ${d}: ${columnDefs.dailyValues[d].label}`
  })
  const table = Papa.unparse(values, { columns })
  return `${hr}
# Daily Values Table
${descriptions.join('\n')}
#
${table}`
}

function rawValuesTable (values, timezone, columns = Object.keys(columnDefs.rawValues)) {
  const descriptions = columns.map(d => {
    return `#     ${d}: ${columnDefs.rawValues[d].label}`
  })
  const rows = values.map(d => {
    const x = { ...d }
    if (columns.includes('datetime_utc')) {
      x.datetime_utc = formatTimestamp(x.datetime, 'ISO', 'UTC')
    }
    if (columns.includes('datetime_local')) {
      x.datetime_local = formatTimestamp(x.datetime, 'D T', timezone)
    }
    return x
  })
  const table = Papa.unparse(rows, { columns })
  return `${hr}
# Raw Values Table
${descriptions.join('\n')}
#
${table}`
}

function flagsTable (flags, timezone, columns = Object.keys(columnDefs.flags)) {
  const descriptions = columns.map(d => {
    return `#     ${d}: ${columnDefs.flags[d].label}`
  })
  const rows = flags.map(d => {
    const x = { ...d }
    if (columns.includes('start_datetime')) {
      x.start_datetime = formatTimestamp(x.start_datetime, 'D T', timezone)
    }
    if (columns.includes('end_datetime')) {
      x.end_datetime = formatTimestamp(x.end_datetime, 'D T', timezone)
    }
    return x
  })
  const table = Papa.unparse(rows, { columns })
  return `${hr}
# Flags Table
${descriptions.join('\n')}
#
${table}`
}

function stations (filename, stations) {
  const body = `${fileHeader()}
#
${stationsTable(stations)}
`
  saveFile(body, filename)
}

function stationMetadata (filename, station, series, profiles) {
  const body = `${fileHeader()}
#
${stationsTable([station])}
#
${seriesTable(series)}
#
${profilesTable(profiles)}
  `
  saveFile(body, filename)
}

function stationDailyValues (filename, station, series, values, discrete) {
  let body = `${fileHeader()}
#
# Description: This file contains daily water temperature data for a single station.
#
#     Daily statistics (min/mean/max) were computed over all continuous timeseries. If two
#     or more timeseries overlap (e.g. duplicate loggers or loggers at different depths) then
#     measurements from all loggers are aggregated within the same day. The daily
#     or raw measurement data for each each logger can be downloaded on the Explore Station
#     page for this station.
#
#     Only continuous timeseries data are included in this daily aggregation. Measurements
#     for discrete timeseries are provided in the raw values table below (if any).
#
#     QAQC flags are also aggregated over all timeseries. If one or more measurements
#     during a single day were flagged then that flag is assigned to the entire day.
#     If more than one type of flag occurred in a single day then the unique flag labels
#     are combined into a comma-separated list.
#
${stationsTable([station], ['organization_code', 'id', 'code', 'latitude', 'longitude', 'timezone', 'description', 'waterbody_name', 'waterbody_type', 'placement', 'mixed', 'active', 'reference'])}
#
${seriesTable(series)}
#
${dailyValuesTable(values, ['date', 'n', 'min_temp_c', 'mean_temp_c', 'max_temp_c', 'flag'])}
`
  if (discrete && discrete.length > 0) {
    body += `#
${rawValuesTable(discrete, station.timezone)}
`
  }

  saveFile(body, filename)
}

function seriesDailyValues (filename, station, series, dailyValues, discreteValues) {
  let body = `${fileHeader()}
#
# Description: This file contains daily water temperature data for each timeseries at a single station.
#
#     Daily statistics (min/mean/max) were computed for each continuous timeseries.
#
#     Only continuous timeseries data are included in this daily aggregation. Measurements
#     for discrete timeseries are provided in the raw values table below (if any).
#
#     QAQC flags are also aggregated to daily timesteps. If one or more measurements
#     during a single day were flagged then that flag is assigned to the entire day.
#     If more than one type of flag occurred in a single day then the unique flag labels
#     are combined into a comma-separated list.
#
${stationsTable([station], ['organization_code', 'id', 'code', 'latitude', 'longitude', 'timezone', 'description', 'waterbody_name', 'waterbody_type', 'placement', 'mixed', 'active', 'reference'])}
#
${seriesTable(series)}
#
${dailyValuesTable(dailyValues)}
`
  if (discreteValues && discreteValues.length > 0) {
    body += `#
${rawValuesTable(discreteValues, station.timezone)}
`
  }

  saveFile(body, filename)
}

function seriesRawValues (filename, station, series, values) {
  const body = `${fileHeader()}
#
# Description: This file contains raw water temperature data for a single timeseries.
#
${stationsTable([station], ['organization_code', 'id', 'code', 'latitude', 'longitude', 'timezone', 'description', 'waterbody_name', 'waterbody_type', 'placement', 'mixed', 'active', 'reference'])}
#
${seriesTable([series])}
#
${rawValuesTable(values, station.timezone)}
  `

  saveFile(body, filename)
}

function profilesValues (filename, station, profiles) {
  const values = profiles.map(d => {
    return d.values.map(v => {
      return {
        profile_id: d.id,
        ...v,
        datetime: formatTimestamp(v.datetime, 'D T', station.timezone)
      }
    })
  }).flat()
  const body = `${fileHeader()}
#
# Description: This file contains vertical profile data for a single station.
#
${stationsTable([station], ['organization_code', 'id', 'code', 'latitude', 'longitude', 'timezone', 'description', 'waterbody_name', 'waterbody_type', 'placement', 'mixed', 'active', 'reference'])}
#
${profilesTable(profiles)}
#
${profilesValuesTable(values)}
  `

  saveFile(body, filename)
}

function flags (filename, station, series, flags) {
  const body = `${fileHeader()}
#
# Description: This file contains the QAQC flags for a single timeseries.
#
${stationsTable([station], ['organization_code', 'id', 'code', 'latitude', 'longitude', 'timezone', 'description', 'waterbody_name', 'waterbody_type', 'placement', 'mixed', 'active', 'reference'])}
#
${seriesTable([series])}
#
${flagsTable(flags, station.timezone)}
  `

  saveFile(body, filename)
}

function saveFile (body, filename) {
  const blob = new Blob([body], {
    type: 'text/csv;charset=utf-8'
  })
  saveAs(blob, filename)
}

Vue.prototype.$download = {
  stations,
  stationMetadata,
  stationDailyValues,
  seriesDailyValues,
  profilesValues,
  seriesRawValues,
  flags
}
