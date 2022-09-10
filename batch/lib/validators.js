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
    column: validFields.when('mode', {
      is: 'COLUMN',
      then: Joi.required()
    }),
    value: Joi.number().when('mode', {
      is: 'VALUE',
      then: Joi.required()
    }),
    units: Joi.string().valid('m', 'ft', 'in', 'cm')
      .when('mode', {
        switch: [
          { is: 'VALUE', then: Joi.required() },
          { is: 'COLUMN', then: Joi.required() }
        ]
      }),
    category: Joi.when('mode', {
      is: 'CATEGORY',
      then: Joi.string().valid('BOTTOM', 'MID-DEPTH', 'SURFACE', 'VARYING').required()
    })
  }

  switch (type) {
    case 'SERIES':
      schema.mode = Joi.string().valid('COLUMN', 'VALUE', 'CATEGORY', 'UNKNOWN').required()
      break
    case 'PROFILES':
      schema.mode = Joi.string().valid('COLUMN').required()
      break
    default:
      throw new Error(`Missing or invalid config type ('${type}')`)
  }

  return Joi.object(schema)
}

const timestampSchema = (fields) => {
  const validFields = Joi.string().valid(...fields)
  return Joi.object({
    columns: Joi.array().min(1).max(2).items(validFields),
    timezone: Joi.object({
      mode: Joi.string()
        .valid('TIMESTAMP', 'COLUMN', 'UTCOFFSET')
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
    missing: Joi.array().default([])
  })
}

const metaSchema = (fields, type) => {
  const validFields = Joi.string().valid(...fields)
  const schema = {
    accuracy: Joi.string().valid('1', '2', '3').allow('', null),
    sop_bath: Joi.boolean().allow('', null),
    reviewed: Joi.boolean().allow('', null),
    flagColumn: validFields.allow('', null)
  }
  if (type === 'SERIES') {
    schema.interval = Joi.string().valid('CONTINUOUS', 'DISCRETE').required()
  }
  return Joi.object(schema)
}

const configSchema = (fields, type) => {
  return Joi.object({
    type: Joi.string().valid('SERIES', 'PROFILES').required(),
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
