module.exports.typeOptions = [
  { value: 'SERIES', label: 'Timeseries' },
  { value: 'PROFILES', label: 'Vertical Profiles' }
]

module.exports.intervalOptions = [
  { value: 'CONTINUOUS', label: 'Continuous Timeseries' },
  { value: 'DISCRETE', label: 'Discrete Measurements' }
]

module.exports.depthUnitsOptions = [
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'ft', label: 'Feet (ft)' }
]

module.exports.depthCategoryOptions = [
  { value: 'SURFACE', label: 'Surface' },
  { value: 'MID-DEPTH', label: 'Mid-Depth' },
  { value: 'BOTTOM', label: 'Bottom' },
  { value: 'HYPORHEIC', label: 'Hypoheic Zone' }
]

module.exports.temperatureUnitsOptions = [
  { value: 'C', label: 'Celsius' },
  { value: 'F', label: 'Fahrenheit' }
]

module.exports.sensorAccuracyOptions = [
  { value: '1', label: 'Level 1: < ±0.25 degC (best; e.g., Hobo Pro v2, Tidbit)' },
  { value: '2', label: 'Level 2: < ±0.5 degC' },
  { value: '3', label: 'Level 3: > ±0.5 degC (worst)' }
]

module.exports.stationTimezoneOptions = [
  { value: 'US/Aleutian', label: 'US/Aleutian (UTC-10,UTC-9)' },
  { value: 'US/Alaska', label: 'US/Alaska (UTC-9,UTC-8)' },
  { value: 'US/Pacific', label: 'US/Pacific (UTC-8,UTC-7)' }
]

const utcOffsetOptions = module.exports.utcOffsetOptions = [
  { value: 'UTC-7', label: 'UTC-07 (PDT)' },
  { value: 'UTC-8', label: 'UTC-08 (AKDT, PST)' },
  { value: 'UTC-9', label: 'UTC-09 (AKST, HDT)' },
  { value: 'UTC-10', label: 'UTC-10 (HST)' }
]

module.exports.fileTimezoneOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'LOCAL', label: 'Local Timezone at Station' },
  { value: 'COLUMN', label: 'Timezone Column' },
  { value: 'UTC', label: 'UTC (GMT)' },
  ...utcOffsetOptions
]

module.exports.placementOptions = [
  { value: 'MAIN', label: 'Main Channel (Stream)' },
  { value: 'SIDE', label: 'Side Channel (Stream)' },
  { value: 'LIMNETIC', label: 'Limnetic Zone (Lake)' },
  { value: 'LAKESHORE', label: 'Lakeshore (Lake)' },
  { value: 'INLET', label: 'Inlet (Lake)' },
  { value: 'OUTLET', label: 'Outlet (Lake)' },
  { value: 'OTHER', label: 'Other' }
]

module.exports.intervalOptions = [
  { value: 'CONTINUOUS', label: 'Continuous' },
  { value: 'DISCRETE', label: 'Discrete' }
]

module.exports.waterbodyTypeOptions = [
  { value: 'STREAM', label: 'Stream/River' },
  { value: 'LAKE', label: 'Lake' },
  { value: 'OTHER', label: 'Other' }
]

module.exports.booleanOptions = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' }
]

module.exports.constraints = {
  station: {
    code: {
      maxLength: 50
    },
    description: {
      maxLength: 250
    },
    waterbody_name: {
      maxLength: 50
    },
    latitude: {
      min: 45,
      max: 75
    },
    longitude: {
      min: -180,
      max: -125
    }
  }
}
