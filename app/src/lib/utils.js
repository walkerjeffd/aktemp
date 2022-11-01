import Papa from 'papaparse'

const { flagLabel } = require('aktemp-utils/flags')

export function readLocalFile (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function parseCsvFile (file, skipLines = 0) {
  // if skipLines > 0, then
  //   1. parse file without headers
  //   2. remove first `skipLines` lines
  //   3. convert unnamed json arrays back to csv (first row should be header)
  //   4. parse result with header
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (fileExtension !== 'csv') {
      return reject(new Error('Invalid file type, must be a comma-separated value (CSV) file with extension \'.csv\''))
    }
    return Papa.parse(file, {
      header: skipLines === 0,
      delimiter: ',',
      download: false,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (skipLines === 0) return resolve(results)
        const csv = Papa.unparse(results.data.slice(skipLines))
        Papa.parse(csv, {
          header: true,
          delimiter: ',',
          download: false,
          skipEmptyLines: 'greedy',
          complete: (results) => {
            return resolve(results)
          },
          error: (err) => reject(err)
        })
      },
      error: (err) => reject(err)
    })
  })
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
    const label = flagLabel(flag)

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
      label,
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
    const label = flagLabel(flag)

    let flagValues = []
    if (new Date(flag.end_datetime) >= new Date(values[0].datetime) && // flag ends after first value
        new Date(flag.start_datetime) <= new Date(values[values.length - 1].datetime)) { // flag starts before last value
      const startIndex = values.findIndex(d => new Date(d.datetime) >= new Date(flag.start_datetime))
      const endIndex = values.findIndex(d => new Date(d.datetime) > new Date(flag.end_datetime))

      if (startIndex < 0 && endIndex >= 0) {
        flagValues = values.splice(0, values.length - endIndex + 1)
      } else if (startIndex >= 0 && endIndex < 0) {
        flagValues = values.splice(startIndex, values.length - startIndex)
      } else {
        flagValues = values.splice(startIndex, endIndex - startIndex)
      }
    }

    return {
      ...flag,
      label,
      values: flagValues
    }
  })

  return { values, flags }
}
