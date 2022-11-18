const debug = require('../debug')
const { createFileSchema } = require('./file')
const { createSeriesSchema } = require('./series')
const { createProfileSchema } = require('./profile')
const { stationSchema } = require('./station')

const configColumnProps = [
  'station_column',
  'datetime_column',
  'time_column',
  'timezone_column',
  'temperature_column',
  'depth_column',
  'flag_column'
]

const validateSchema = module.exports.validateSchema = function (schema, input) {
  const { error, value } = schema.validate(input, { abortEarly: false })
  if (error) throw error
  return value
}

function validateConfigColumns (config, fields) {
  debug('validateConfigColumns(): config, fields ->')
  debug(config)
  debug(fields)
  const errors = []
  configColumnProps.forEach(d => {
    if (config[d]) {
      const i = parseInt(config[d])
      if (Number.isInteger(i)) {
        if (i <= 0 || i > fields.length) {
          errors.push({
            path: ['d'],
            message: `"${d}" contains an invalid column index ('${config[d]}'), must be between 1 and ${fields.length}`
          })
        } else {
          debug(`validateConfigColumns(): setting config.${d}='${fields[i - 1]}' (i=${i - 1})`)
          config[d] = fields[i - 1]
        }
      }
    }
  })
  if (errors.length > 0) {
    const error = new Error('InvalidColumnIndex')
    error.details = errors
    throw error
  }
  return config
}

module.exports.validateFileConfig = function (config, fields, stations) {
  fields = fields.filter(d => !!d)
  if (fields.length === 1) {
    throw new Error(`File only contains one column ('${fields[0]}'). This usually means the file contains extra rows above the column names. Specify the number of lines to skip and try again (but do not skip the line containing column names).`)
  } else if (fields.length === 0) {
    throw new Error('No columns found in file. This usually means the file contains extra rows above the column names. Specify the number of lines to skip and try again (but do not skip the line containing column names).')
  }
  const validated = validateSchema(createFileSchema(fields, stations), config)

  return validateConfigColumns(validated, fields)
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
