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
    series_count: {
      label: 'Number of timeseries'
    },
    series_start_datetime: {
      label: 'First timeseries timestamp (station timezone)',
      timeFormat: 'FFF'
    },
    series_end_datetime: {
      label: 'Last timeseries timestamp (station timezone)',
      timeFormat: 'FFF'
    },
    series_count_days: {
      label: 'Number of days between first and last timeseries dates'
    },
    profiles_count: {
      label: 'Number of vertical profiles'
    },
    profiles_start_date: {
      label: 'First date of vertical profiles (station timezone)',
      timeFormat: 'DD'
    },
    profiles_end_date: {
      label: 'Last date of vertical profiles (station timezone)',
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
      label: 'Start Timestamp (station timezone)'
    },
    end_datetime: {
      label: 'End Timestamp (station timezone)'
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
      label: 'Sensor Accuracy Level (1 = < ±0.25 degC (best); 2: < ±0.5 degC; 3: > ±0.5 degC (worst))'
    },
    reviewed: {
      label: 'QAQC Review Complete'
    }
  },
  dailyValues: {
    date: {
      label: 'Date (station timezone)'
    },
    n: {
      label: 'Number of measurements'
    },
    min: {
      label: 'Minimum temperature (degC)'
    },
    mean: {
      label: 'Mean temperature (degC)'
    },
    max: {
      label: 'Maximum temperature (degC)'
    },
    flags: {
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
      label: 'Date (station timezone)'
    },
    accuracy: {
      label: 'Sensor Accuracy Level (1 = < ±0.25 degC (best); 2: < ±0.5 degC; 3: > ±0.5 degC (worst))'
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
      label: 'Timestamp (station timezone)'
    },
    depth_m: {
      label: 'Depth (m)'
    },
    value: {
      label: 'Temperature (degC)'
    }
  }
}

function fileHeader () {
  const now = luxon.DateTime.now()
  return `# AKTEMP | Alaska Stream Temperature Database
# File downloaded: ${formatTimestamp(now, 'D t ZZZZ', 'local')}`
}

function stationTable (stations = [], columns = Object.keys(columnDefs.stations)) {
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
      x.start_datetime = formatTimestamp(x.start_datetime, 'D T', d.timezone)
    }
    if (columns.includes('end_datetime')) {
      x.end_datetime = formatTimestamp(x.end_datetime, 'D T', d.timezone)
    }
    return x
  })
  const table = Papa.unparse(rows, { columns })
  return `${hr}
# Timeseries Metadata Table
${descriptions.join('\r\n')}
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
${descriptions.join('\r\n')}
#
${table}`
}

function profileValuesTable (values, columns = Object.keys(columnDefs.profileValues)) {
  const descriptions = columns.map(d => {
    return `#     ${d}: ${columnDefs.profileValues[d].label}`
  })
  const table = Papa.unparse(values, { columns })
  return `${hr}
# Daily Values Table
${descriptions.join('\r\n')}
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
${descriptions.join('\r\n')}
#
${table}`
}

// ----

function stations (filename, stations) {
  const body = `${fileHeader()}
#
${stationTable(stations)}
`
  saveFile(body, filename)
}

function stationDailyValues (filename, station, series, values) {
  const body = `${fileHeader()}
#
# Description: This file contains daily water temperature data for a single station.
#
#     Daily statistics (min/mean/max) were computed over all timeseries. If two or more
#     timeseries overlap (e.g. duplicate loggers or loggers at different depths) then
#     measurements from all loggers are aggregated within the same day. The daily
#     or raw measurement data for each each logger can be downloaded on the Explore Station
#     page for this station.
#
#     Both discrete and continuous timeseries data are included in this daily aggregation.
#
#     QAQC flags are also aggregated over all timeseries. If one or more measurements
#     during a single day were flagged then that flag is assigned to the entire day.
#     If more than one type of flag occurred in a single day then the unique flag labels
#     are combined into a comma-separated list.
#
${stationTable([station], ['organization_code', 'id', 'code', 'latitude', 'longitude', 'timezone', 'description', 'waterbody_name', 'waterbody_type', 'placement', 'mixed', 'active', 'reference'])}
#
${seriesTable(series)}
#
${dailyValuesTable(values, ['date', 'n', 'min', 'mean', 'max', 'flags'])}
  `

  saveFile(body, filename)
}

function stationProfileValues (filename, station, profiles) {
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
${stationTable([station], ['organization_code', 'id', 'code', 'latitude', 'longitude', 'timezone', 'description', 'waterbody_name', 'waterbody_type', 'placement', 'mixed', 'active', 'reference'])}
#
${profilesTable(profiles)}
#
${profileValuesTable(values)}
  `

  saveFile(body, filename)
}

function stationMetadata (filename, station, series, profiles) {
  const body = `${fileHeader()}
#
${stationTable([station])}
#
${seriesTable(series)}
#
${profilesTable(profiles)}
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
  stationProfileValues
}
