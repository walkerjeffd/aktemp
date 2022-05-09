function convertDepthUnits (value, units) {
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

module.exports = {
  convertDepthUnits
}
