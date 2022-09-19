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

  flags = flags.map(flag => {
    flag.label = flag.flag_type_id === 'OTHER' ? flag.flag_type_other : flag.flag_type_id

    const startIndex = values.findIndex(d => d.date >= flag.start_date)
    const endIndex = values.findIndex(d => d.date >= flag.end_date)

    let flagValues
    if (startIndex >= 0 && endIndex < 0) {
      // flag ends after last value
      flagValues = values.splice(startIndex, values.length - startIndex)
    } else if (startIndex === 0 && endIndex >= 0) {
      // flag begins on or before first value
      flagValues = values.splice(startIndex, endIndex)
    } else {
      flagValues = values.splice(startIndex, endIndex - startIndex + 1)
    }
    return {
      ...flag,
      values: flagValues
    }
  })
  return { values, flags }
}

export function assignRawFlags (values, flags) {
  values = values.slice()

  if (values.length === 0) {
    return { values, flags: [] }
  }

  flags = flags.map(flag => {
    flag.label = flag.flag_type_id === 'OTHER' ? flag.flag_type_other : flag.flag_type_id

    let flagValues = []
    if (new Date(flag.end_datetime) >= new Date(values[0].datetime) && // flag ends after first value
        new Date(flag.start_datetime) <= new Date(values[values.length - 1].datetime)) { // flag starts before last value
      const startIndex = values.findIndex(d => new Date(d.datetime) >= new Date(flag.start_datetime))
      const endIndex = values.findIndex(d => new Date(d.datetime) >= new Date(flag.end_datetime))

      if (startIndex < 0 && endIndex >= 0) {
        flagValues = values.splice(0, values.length - endIndex + 1)
      } else if (startIndex >= 0 && endIndex < 0) {
        flagValues = values.splice(startIndex, values.length - startIndex)
      } else {
        flagValues = values.splice(startIndex, endIndex - startIndex + 1)
      }
    }

    return {
      ...flag,
      values: flagValues
    }
  })

  return { values, flags }
}
