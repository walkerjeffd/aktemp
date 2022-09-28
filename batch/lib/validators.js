const Joi = require('joi')

function validateFileFields (fields) {
  const schema = Joi.array()
    .min(2)
    .items(Joi.string())
    .unique()
    .required()

  const { error, value } = schema.validate(fields)

  if (error) {
    // console.error(error)
    throw new Error(`Invalid file fields (${error.toString()})`)
  }

  return value
}

const fileSchema = () => {
  return Joi.object({
    filename: Joi.string().required(),
    skipLines: Joi.number().integer().allow('', null).empty(['', null]).default(0)
  })
}

const stationSchema = (fields) => {
  const validFields = Joi.string().valid(...fields)
  return Joi.object({
    mode: Joi.string().valid('STATION', 'COLUMN').required(),
    stationId: Joi.number().integer().when('mode', {
      is: 'STATION',
      then: Joi.required()
    }),
    column: validFields.when('mode', {
      is: 'COLUMN',
      then: Joi.required()
    })
  })
}

const depthSchema = (fields, type) => {
  const validFields = Joi.string().valid(...fields)
  const schema = {
    category: Joi.string().valid('BOTTOM', 'MID-DEPTH', 'SURFACE').allow('', null).empty(['']),
    value: Joi.number().allow('', null),
    column: type === 'PROFILES' ? validFields.required() : validFields.allow('', null).empty(['']),
    units: Joi
      .when('value', {
        is: Joi.number().valid(null, ''),
        then: Joi.when('column', {
          is: Joi.any().valid(null, ''),
          then: Joi.optional().allow('', null),
          otherwise: Joi.string().valid('m', 'ft', 'in', 'cm').required()
        }),
        otherwise: Joi.string().valid('m', 'ft', 'in', 'cm').required()
      })
  }

  return Joi.object(schema)
}

const timestampSchema = (fields) => {
  const validFields = Joi.string().valid(...fields)
  return Joi.object({
    columns: Joi.array().min(1).max(2).items(validFields),
    timezone: Joi.object({
      mode: Joi.string()
        .valid('GUESS', 'TIMESTAMP', 'COLUMN', 'UTCOFFSET')
        .required(),
      column: validFields
        .when('mode', {
          is: 'COLUMN',
          then: Joi.required()
        }),
      utcOffset: Joi.number().integer()
        .valid(0, -7, -8, -9)
        .when('mode', {
          is: 'UTCOFFSET',
          then: Joi.required()
        })
    }).required()
  })
}

const valueSchema = (fields) => {
  const validFields = Joi.string().valid(...fields)
  return Joi.object({
    column: validFields.required(),
    units: Joi.string().valid('C', 'F').required(),
    missing: Joi.array().default([]),
    flagColumn: validFields.allow('', null)
  })
}

const metaSchema = (fields, type) => {
  const schema = {
    accuracy: Joi.string().valid('1', '2', '3').allow('', null),
    sop_bath: Joi.boolean().allow('', null),
    reviewed: Joi.boolean().allow('', null).empty(['', null]).default(false)
  }
  if (type === 'SERIES') {
    schema.interval = Joi.string().valid('CONTINUOUS', 'DISCRETE').required()
  }
  return Joi.object(schema)
}

const configSchema = (fields, type) => {
  return Joi.object({
    type: Joi.string().valid('SERIES', 'PROFILES').required(),
    file: fileSchema().required(),
    station: stationSchema(fields).required(),
    depth: depthSchema(fields, type).required(),
    timestamp: timestampSchema(fields).required(),
    value: valueSchema(fields).required(),
    meta: metaSchema(fields, type).required()
  })
}

function validateSchema (schema, input) {
  const { error, value } = schema.validate(input)

  if (error) {
    // console.error(error)
    throw new Error(error)
  }

  return value
}

function validateFileConfig (config, fields) {
  fields = validateFileFields(fields)
  return validateSchema(configSchema(fields, config.type), config)
}

module.exports = {
  validateSchema,
  validateFileConfig,
  validateFileFields,
  schemas: {
    station: stationSchema,
    depth: depthSchema,
    timestamp: timestampSchema,
    value: valueSchema,
    meta: metaSchema
  }
}
