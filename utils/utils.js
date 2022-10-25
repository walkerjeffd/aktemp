const d3 = require('d3')

const isNumber = module.exports.isNumber = function (x) {
  return !isNaN(parseFloat(x)) && !isNaN(+x)
}

const isString = module.exports.isString = function (value) {
  return typeof value === 'string' || value instanceof String
}

const isEmptyString = module.exports.isEmptyString = function (x) {
  return isString(x) && x.trim() === ''
}

module.exports.stripBom = function (x) {
  // https://github.com/sindresorhus/strip-bom/blob/main/index.js
  if (typeof x !== 'string') {
    throw new TypeError('Expected a string, got ' + typeof x)
  }

  // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
  // conversion translates it to FEFF (UTF-16 BOM)
  if (x.charCodeAt(0) === 0xFEFF) {
    return x.slice(1)
  }

  return x
}

module.exports.emptyStringToNull = function (x) {
  return isEmptyString(x) ? null : x
}

module.exports.convertDepthUnits = function (value, units) {
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

module.exports.medianFrequency = function (datetimes) {
  const sorted = datetimes.sort((a, b) => d3.ascending(a.valueOf(), b.valueOf()))
  const deltas = sorted.map((d, i) => {
    if (i === 0) return null
    return ((new Date(d)).valueOf() - (new Date(sorted[i - 1])).valueOf()) / 1e3 / 60 // ms -> min
  })
  return d3.median(deltas)
}
