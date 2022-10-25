import Vue from 'vue'
import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import { luxon, formatTimestamp } from 'aktemp-utils/time'

const stationColumns = {
  organization_code: {
    label: 'Organization Code'
  },
  id: {
    label: 'Station ID'
  },
  code: {
    label: 'Station Code'
  },
  description: {
    label: 'Station Description'
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
  waterbody_type: {
    label: 'Waterbody type'
  },
  waterbody_name: {
    label: 'Waterbody name'
  },
  placement: {
    label: 'Placement'
  },
  active: {
    label: 'Active station'
  },
  mixed: {
    label: 'Fully mixed'
  },
  reference: {
    label: 'Reference URL'
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
}

const seriesColumns = {
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
    label: 'Timeseries start'
  },
  end_datetime: {
    label: 'Timeseries end'
  },
  interval: {
    label: 'Interval (CONTINUOUS, DISCRETE)'
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
    label: 'SOP Pre/Post Bath'
  },
  accuracy: {
    label: 'Sensor Accuracy Level (1 = < ±0.25 degC (best), 2: < ±0.5 degC, 3: > ±0.5 degC (worst))'
  },
  reviewed: {
    label: 'Timeseries has been reviewed'
  }
}

const dailyValuesColumns = {
  series_id: 'Timeseries ID',
  date: 'Date',
  n: 'Number of measurements',
  min: 'Minimum temperature (degC)',
  mean: 'Mean temperature (degC)',
  max: 'Maximum temperature (degC)',
  flags: 'QAQC flags'
}

function csv (rows, filename, columns) {
  const csv = Papa.unparse(rows, { columns: columns || Object.keys(rows[0]) })
  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8'
  })
  saveAs(blob, filename)
}

function stations (stations, columns) {
  const now = luxon.DateTime.now()
  columns = columns || Object.keys(stationColumns)
  const filename = `AKTEMP-stations-${formatTimestamp(now, 'yMMeeHHmmss', 'local')}.csv`

  const columnDescriptions = columns.map(d => {
    return `#    ${d}: ${stationColumns[d].label}`
  })
  const header = `# AKTEMP: Alaska Stream Temperature Database
# URL: ??
# Downloaded at: ${formatTimestamp(now, 'FFF', 'local')}
# Citation: ??
#
# Stations table
#
# Column descriptions:
${columnDescriptions.join('\r\n')}
#
#
`
  const timeColumns = columns.filter(d => stationColumns[d].timeFormat)
  console.log(timeColumns)
  stations.forEach((d, i) => {
    timeColumns.forEach(c => {
      if (i === 0) {
        console.log(d, c, d[c])
      }
      if (d[c]) {
        d[c] = formatTimestamp(d[c], stationColumns[c].timeFormat, d.timezone)
      }
    })
  })
  const rows = Papa.unparse(stations, { columns })
  const body = header + rows
  const blob = new Blob([body], {
    type: 'text/csv;charset=utf-8'
  })
  saveAs(blob, filename)
}

function series (series) {
  const now = luxon.DateTime.now()
  const filename = `AKTEMP-timeseries-${formatTimestamp(now, 'yMMeeHHmmss', 'local')}.csv`

  const seriesColumnDescriptions = Object.keys(seriesColumns).map(d => {
    return `#    ${d}: ${seriesColumns[d].label}`
  })
  const seriesTable = Papa.unparse(series, { columns: Object.keys(seriesColumns) })

  // const dailyValuesColumnDescriptions = Object.keys(dailyValuesColumns).map(d => {
  //   return `#    ${d}: ${dailyValuesColumns[d].label}`
  // })

  const header = `# AKTEMP: Alaska Stream Temperature Database
# URL: ??
# Downloaded at: ${formatTimestamp(now, 'FFF', 'local')}
# Citation: ??
#
# Timeseries Data
#
# Series table columns:
${seriesColumnDescriptions.join('\r\n')}
#
${seriesTable}
#
# Daily values table columns:
${seriesColumnDescriptions.join('\r\n')}
#
`
  const rows = Papa.unparse([], { columns: Object.keys(dailyValuesColumns) })
  const body = header + rows
  const blob = new Blob([body], {
    type: 'text/csv;charset=utf-8'
  })
  saveAs(blob, filename)
}

Vue.prototype.$download = {
  csv,
  stations,
  series
}
