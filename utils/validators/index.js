const { createFileSchema, fileFieldsSchema } = require('./file')
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
  fields = validateFileFields(fields)
  return validateSchema(createFileSchema(fields, stations), config)
}

module.exports.validateStation = function (station) {
  return validateSchema(stationSchema, station)
}
