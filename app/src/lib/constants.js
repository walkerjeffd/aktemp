export const fieldConstraints = {
  station: {
    code: {
      minLength: 1,
      maxLength: 50
    },
    description: {
      maxLength: 250
    },
    waterbodyName: {
      maxLength: 50
    }
  }
}

export const stationModes = ['STATION', 'COLUMN']

export const fileTypeOptions = [
  { value: 'CONTINUOUS', label: 'Continuous Timeseries' },
  { value: 'DISCRETE', label: 'Discrete Measurements' },
  { value: 'PROFILES', label: 'Vertical Profiles' }
]

export const variableOptions = [
  {
    value: 'TEMP_C',
    label: 'Temperature (degC)'
  }
]

export const depthModes = ['COLUMN', 'VALUE', 'CATEGORY']

export const depthCategoryOptions = [
  { value: 'SURFACE', label: 'Surface' },
  { value: 'MID-DEPTH', label: 'Mid-Depth' },
  { value: 'BOTTOM', label: 'Bottom' }
]

export const temperatureUnitsOptions = [
  { value: 'C', label: 'Celsius' },
  { value: 'F', label: 'Fahrenheit' }
]

export const sensorAccuracyOptions = [
  { value: '1', label: 'Level 1: < ±0.25 degC (best; e.g., Hobo Pro v2, Tidbit)' },
  { value: '2', label: 'Level 2: < ±0.5 degC' },
  { value: '3', label: 'Level 3: > ±0.5 degC (worst)' },
  { value: 'UNKNOWN', label: 'Unknown' }
]

export const timezoneOptions = [
  { value: 'US/Alaska', label: 'US/Alaska (UTC-9/UTC-8)' },
  { value: 'US/Pacific', label: 'US/Pacific (UTC-8/UTC-7)' }
]

export const timezoneModes = [
  'UTCOFFSET', 'COLUMN', 'TIMESTAMP'
]

export const utcOffsetOptions = [
  { value: -9, label: 'UTC-09 (AKST)' },
  { value: -8, label: 'UTC-08 (AKDT/PST)' },
  { value: -7, label: 'UTC-07 (PDT)' },
  { value: 0, label: 'UTC' }
]

// https://day.js.org/docs/en/parse/string-format
export const timestampFormats = [
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm'
]

export const placementOptions = [
  { value: 'MAIN', label: 'Main Channel' },
  { value: 'SIDE', label: 'Side Channel' },
  { value: 'UNKNOWN', label: 'Unknown' }
]

export const intervalOptions = [
  { value: 'CONTINOUS', label: 'Continuous' },
  { value: 'DISCRETE', label: 'Discrete' }
]

export const waterbodyTypeOptions = [
  { value: 'STREAM', label: 'Stream/River' },
  { value: 'LAKE', label: 'Lake' },
  { value: 'OTHER', label: 'Other' },
  { value: 'UNKNOWN', label: 'Unknown' }
]

export const mixedOptions = [
  { value: 'TRUE', label: 'Yes' },
  { value: 'FALSE', label: 'No' },
  { value: 'UNKNOWN', label: 'Unknown' }
]

export const depthUnitsOptions = [
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'ft', label: 'Feet (ft)' }
]

export const booleanOptions = ['TRUE', 'FALSE']
export const booleanOrNullOptions = ['TRUE', 'FALSE', 'UNKNOWN']

export const flagTypeOptions = [
  {
    id: 'OOW',
    description: 'Out of water'
  }, {
    id: 'BURIED',
    description: 'Buried logger'
  }, {
    id: 'OTHER',
    description: 'Other'
  }
]
