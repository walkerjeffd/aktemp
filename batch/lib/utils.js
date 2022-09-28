function isNumber (x) {
  return !(isNaN(x) || x === null || (typeof x === 'string' && x.trim() === ''))
}

function convertDepthUnits (value, units) {
  if (!isNumber(value)) return null
  if (units === 'm') {
    return value
  } else if (units === 'ft') {
    return value * 0.3048
  } else if (units === 'in') {
    return value * 0.3048 / 12
  } else if (units === 'cm') {
    return value / 100
  } else {
    throw new Error(`Invalid depth units ('${units}')`)
  }
}

async function medianFrequency (datetimes) {
  const d3 = await import('d3')
  const sorted = datetimes.sort((a, b) => d3.ascending(a.valueOf(), b.valueOf()))
  const deltas = sorted.map((d, i) => {
    if (i === 0) return null
    return ((new Date(d)).valueOf() - (new Date(sorted[i - 1])).valueOf()) / 1e3 / 60 // ms -> min
  })
  return d3.median(deltas)
}

module.exports = {
  convertDepthUnits,
  medianFrequency,
  isNumber
}
