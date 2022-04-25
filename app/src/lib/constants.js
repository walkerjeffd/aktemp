export const variableOptions = [
  {
    id: 'TEMP_C',
    label: 'Temperature',
    units: 'degC'
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

export const utcOffsets = [
  {
    id: 'UTC-09',
    label: 'UTC-09 (AKST)',
    value: -9
  },
  {
    id: 'UTC-08',
    label: 'UTC-08 (PST or AKDT)',
    value: -8
  },
  {
    id: 'UTC-07',
    label: 'UTC-07 (PDT)',
    value: -7
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
