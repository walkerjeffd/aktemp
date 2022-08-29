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
  else return 'UNKNOWN'
}

export const sleep = async (ms) => {
  await new Promise((resolve, reject) => setTimeout(resolve, 2000))
}
