export const variableOptions = [
  {
    id: 'TEMP_C',
    label: 'Temperature',
    units: 'C'
  }
]

export const temperatureUnitsOptions = [
  {
    value: 'C',
    label: 'Celsius'
  },
  {
    value: 'F',
    label: 'Fahrenheit'
  }
]

export const sensorAccuracyOptions = [
  {
    value: '1',
    label: 'Level 1: < ±0.25 degC (best; e.g., Hobo Pro v2, Tidbit)'
  },
  {
    value: '2',
    label: 'Level 2: < ±0.5 degC'
  },
  {
    value: '3',
    label: 'Level 3: > ±0.5 degC (worst)'
  },
  {
    value: 'unknown',
    label: 'Unknown'
  }
]

export const timezoneOptions = [
  {
    id: 'US/Alaska',
    label: 'US/Alaska (UTC-9/UTC-8)'
  },
  {
    id: 'US/Pacific',
    label: 'US/Pacific (UTC-8/UTC-7)'
  }
]

export const utcOffsetOptions = [
  {
    id: 'UTC-09',
    label: 'UTC-09 (AKST)',
    value: -9
  },
  {
    id: 'UTC-08',
    label: 'UTC-08 (AKDT/PST)',
    value: -8
  },
  {
    id: 'UTC-07',
    label: 'UTC-07 (PDT)',
    value: -7
  },
  {
    id: 'UTC',
    label: 'UTC',
    value: 0
  }
]

// https://day.js.org/docs/en/parse/string-format
export const timestampFormats = [
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm'
]

export const placementOptions = [
  {
    id: 'MAIN',
    label: 'Main Channel'
  },
  {
    id: 'SIDE',
    label: 'Side Channel'
  },
  {
    id: 'UNKNOWN',
    label: 'Unknown'
  }
]

export const waterbodyTypeOptions = [
  {
    id: 'STREAM',
    label: 'Stream or River'
  },
  {
    id: 'LAKE',
    label: 'Lake'
  },
  {
    id: 'UNKNOWN',
    label: 'Unknown'
  }
]

export const mixedOptions = [
  {
    id: 'YES',
    label: 'Yes'
  },
  {
    id: 'NO',
    label: 'No'
  },
  {
    id: 'UNKNOWN',
    label: 'Unknown'
  }
]

export const depthUnitsOptions = [
  {
    value: 'cm',
    label: 'Centimeters (cm)'
  }, {
    value: 'm',
    label: 'Meters (m)'
  }, {
    value: 'in',
    label: 'Inches (in)'
  }, {
    value: 'ft',
    label: 'Feet (ft)'
  }
]
