import Papa from 'papaparse'

export function parseCsvFile (file) {
  return new Promise((resolve, reject) => {
    return Papa.parse(file, {
      header: true,
      comments: '#',
      delimiter: ',',
      download: false,
      skipEmptyLines: 'greedy',
      complete: (results) => resolve(results),
      error: (err) => reject(err)
    })
  })
}

function isString (value) {
  return typeof value === 'string' || value instanceof String
}

export const parseBooleanOption = (value) => {
  if (isString(value) && value.toLowerCase() === 'true') {
    return true
  } else if (isString(value) && value.toLowerCase() === 'false') {
    return false
  } else {
    return null
  }
}
export const formatBooleanOption = (value) => {
  if (value === true) return 'TRUE'
  else if (value === false) return 'FALSE'
}

export const sleep = async (ms) => {
  await new Promise((resolve, reject) => setTimeout(resolve, 2000))
}

export const trim = (x) => {
  if (typeof x === 'string') {
    return x.trim()
  }
  return x
}

export const joinStrings = x => x.map(d => `'${d}'`).join(', ')

export function assignDailyFlags (values, flags) {
  values = values.slice()

  flags.forEach((flag, i) => {
    flag.label = flag.flag_type_id === 'OTHER' ? flag.flag_type_other : flag.flag_type_id

    const startIndex = values.findIndex(d => d.date >= flag.start_date)
    const endIndex = values.findIndex(d => d.date >= flag.end_date)

    if (startIndex >= 0 && endIndex < 0) {
      // flag ends after last value
      flag.values = values.splice(startIndex, values.length - startIndex)
    } else if (startIndex === 0 && endIndex >= 0) {
      // flag begins on or before first value
      flag.values = values.splice(startIndex, endIndex)
    } else {
      flag.values = values.splice(startIndex, endIndex - startIndex + 1)
    }
  })
  return { values, flags }
}
