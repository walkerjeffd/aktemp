const Joi = require('joi')
const {
  typeOptions,
  intervalOptions,
  fileTimezoneOptions,
  sensorAccuracyOptions,
  depthCategoryOptions,
  depthUnitsOptions,
  temperatureUnitsOptions
} = require('../constants')

const fileFieldsSchema = Joi.array()
  .min(2)
  .items(Joi.string())
  .unique()
  .required()

const createFileSchema = (fields, stations) => {
  const validFields = Joi.string().valid(...fields)
  const stationCodes = stations.map(d => d.code)
  const validStationCodes = Joi.string().valid(...stationCodes)
  return Joi.object({
    file_skip: Joi.number()
      .integer()
      .empty(['', null])
      .default(0),
    file_type: Joi.string()
      .uppercase()
      .trim()
      .valid(...typeOptions.map(d => d.value))
      .required(),
    interval: Joi.string()
      .uppercase()
      .trim()
      .allow(null)
      .empty(['', null])
      .valid(...intervalOptions.map(d => d.value))
      .when('file_type', {
        is: 'SERIES',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
    // STATION
    station_code: validStationCodes
      .allow(null)
      .empty(['', null])
      .when('station_column', {
        is: Joi.exist(),
        then: Joi.forbidden(),
        otherwise: Joi.required()
      }),
    station_column: validFields
      .empty(['', null]),
    // TIMESTAMP
    datetime_column: validFields
      .empty(['', null])
      .required(),
    time_column: validFields
      .allow(null)
      .empty(['', null]),
    datetime_format: Joi.string()
      .empty(['', null])
      .required(),
    timezone: Joi.string()
      .uppercase()
      .trim()
      .valid(...fileTimezoneOptions.map(d => d.value))
      .allow(null)
      .empty(['', null])
      .default('NONE')
      .when('datetime_format', {
        is: Joi.not('ISO'),
        then: Joi.required()
      }),
    timezone_column: validFields
      .allow(null)
      .empty(['', null])
      .when('timezone', {
        is: 'COLUMN',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
    // TEMPERATURE
    temperature_column: validFields.required(),
    temperature_units: Joi.string()
      .uppercase()
      .trim()
      .valid(...temperatureUnitsOptions.map(d => d.value))
      .empty(['', null])
      .required(),
    temperature_missing: Joi.string()
      .allow(null)
      .empty(['', null]),
    flag_column: validFields
      .allow(null)
      .empty(['', null])
      .when('file_type', {
        is: 'SERIES',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      }),
    // DEPTH
    depth_category: Joi.string()
      .uppercase()
      .trim()
      .valid(...depthCategoryOptions.map(d => d.value))
      .allow(null)
      .empty(['', null])
      .when('file_type', {
        is: 'SERIES',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      }),
    depth_value: Joi.number()
      .allow('', null)
      .empty(['', null])
      .when('file_type', {
        is: 'SERIES',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      }),
    depth_column: validFields
      .allow(null)
      .empty(['', null])
      .when('file_type', {
        is: 'SERIES',
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
    depth_units: Joi
      .when('depth_value', {
        is: Joi.number().valid(null, ''),
        then: Joi.when('depth_column', {
          is: Joi.any().valid(null, ''),
          then: Joi.optional().allow('', null),
          otherwise: Joi.string()
            .valid(...depthUnitsOptions.map(d => d.value))
            .required()
        }),
        otherwise: Joi.string()
          .valid(...depthUnitsOptions.map(d => d.value))
          .required()
      }),
    // METADATA
    sop_bath: Joi.boolean()
      .allow('', null)
      .empty(['', null])
      .optional()
      .when('file_type', {
        is: 'SERIES',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      }),
    accuracy: Joi.string()
      .valid(...sensorAccuracyOptions.map(d => d.value))
      .empty(['', null])
      .optional(),
    reviewed: Joi.boolean()
      .allow('', null)
      .empty(['', null])
      .default(false)
  })
}

module.exports = {
  createFileSchema,
  fileFieldsSchema
}
