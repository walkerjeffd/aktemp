const { createFileSchema, fileFieldsSchema } = require('./file')
const { createSeriesSchema } = require('./series')
const { createProfileSchema } = require('./profile')
const { stationSchema } = require('./station')

const validateSchema = module.exports.validateSchema = function (schema, input) {
  const { error, value } = schema.validate(input, { abortEarly: false })
  if (error) throw error
  return value
}

const validateFileFields = module.exports.validateFileFields = function (fields) {
  return validateSchema(fileFieldsSchema, fields)
}

module.exports.validateFileConfig = function (config, fields, stations) {
  try {
    fields = validateFileFields(fields)
  } catch (err) {
    console.log(err)
    throw new Error(`Invalid file columns (${fields.map(d => `'${d}'`).join(',')}). File must contain at least two columns (date/time, temperature) and all column names must be unique.`)
  }
  return validateSchema(createFileSchema(fields, stations), config)
}

module.exports.validateStation = function (station) {
  return validateSchema(stationSchema, station)
}

module.exports.validateSeries = function (series, stations) {
  return validateSchema(createSeriesSchema(stations), series)
}

module.exports.validateProfile = function (profile, stations) {
  return validateSchema(createProfileSchema(stations), profile)
}
