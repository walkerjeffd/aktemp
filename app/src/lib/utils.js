import Papa from 'papaparse'

const { flagLabel } = require('aktemp-utils/flags')

export function splitLines (t, limit = 100) { return t.split(/\r\n|\r|\n/, limit) }

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

export function getContinuousChunks (values, accessor = 'datetime') {
  console.log('getContinuousChunks()', values.length)
  const chunks = []
  values.forEach((d, i) => {
    if (i === 0) {
      // create first chunk
      chunks.push({
        flag: !!d.flag,
        values: [d]
      })
    } else if (!!values[i].flag !== !!values[i - 1].flag) {
      // create new chunk at flag boundary
      if (values[i - 1].flag) {
        if (values[i][accessor].valueOf() - values[i - 1][accessor].valueOf() <= 25 * 60 * 60 * 1000) {
          chunks[chunks.length - 1].values.push(d)
        }
        chunks.push({
          flag: !!d.flag,
          values: [d]
        })
      } else {
        const newChunk = {
          flag: !!d.flag,
          values: []
        }
        if (values[i][accessor].valueOf() - values[i - 1][accessor].valueOf() <= 25 * 60 * 60 * 1000) {
          newChunk.values.push(values[i - 1])
        }
        newChunk.values.push(d)
        chunks.push(newChunk)
      }
    } else if (values[i][accessor].valueOf() - values[i - 1][accessor].valueOf() > 25 * 60 * 60 * 1000) {
      // create new chunk after gap
      chunks.push({
        flag: !!d.flag,
        values: [d]
      })
    } else {
      // continue chunk
      chunks[chunks.length - 1].values.push(d)
    }
  })
  return chunks
}

export function getDiscreteChunks (values) {
  return [
    {
      flag: false,
      values: values.filter(d => !d.flag)
    }, {
      flag: true,
      values: values.filter(d => !!d.flag)
    }
  ]
}
