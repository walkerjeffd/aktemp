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
    mode: Joi.string().valid('station', 'column').required(),
    stationId: Joi.number().integer().when('mode', {
      is: 'station',
      then: Joi.required()
    }),
    column: validFields.when('mode', {
      is: 'column',
      then: Joi.required()
    })
  })
}

const depthSchema = (fields) => {
  const validFields = Joi.string().valid(...fields)
  return Joi.object({
    mode: Joi.string().valid('column', 'value', 'category', 'unknown').required(),
    column: validFields.when('mode', {
      is: 'column',
      then: Joi.required()
    }),
    value: Joi.number().when('mode', {
      is: 'value',
      then: Joi.required()
    }),
    units: Joi.string().valid('m', 'ft', 'in', 'cm')
      .when('mode', {
        switch: [
          { is: 'value', then: Joi.required() },
          { is: 'column', then: Joi.required() }
        ]
      }),
    category: Joi.when('mode', {
      is: 'category',
      then: Joi.string().valid('BOTTOM', 'MIDDLE', 'SURFACE').required()
    })
  })
}

const timestampSchema = (fields) => {
  const validFields = Joi.string().valid(...fields)
  return Joi.object({
    columns: Joi.array().min(1).max(2).items(validFields),
    timezone: Joi.object({
      mode: Joi.string()
        .valid('timestamp', 'column', 'utcOffset')
        .required(),
      column: validFields
        .when('mode', {
          is: 'column',
          then: Joi.required()
        }),
      utcOffset: Joi.number().integer()
        .valid(0, -7, -8, -9)
        .when('mode', {
          is: 'utcOffset',
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

const metaSchema = (fields) => {
  const validFields = Joi.string().valid(...fields)
  return Joi.object({
    interval: Joi.string().valid('CONTINUOUS', 'DISCRETE').required(),
    accuracy: Joi.string().valid('1', '2', '3'),
    sop_bath: Joi.boolean().allow('', null),
    reviewed: Joi.boolean().allow('', null),
    flagColumn: validFields
  })
}

const configSchema = (fields) => {
  return Joi.object({
    station: stationSchema(fields).required(),
    depth: depthSchema(fields).required(),
    timestamp: timestampSchema(fields).required(),
    value: valueSchema(fields).required(),
    meta: metaSchema(fields).required()
  })
}

function validateFileConfig (config, fields) {
  fields = validateFileFields(fields)
  return validateSchema(configSchema(fields), config)
}

function validateSchema (schema, input) {
  const { error, value } = schema.validate(input)

  if (error) {
    // console.error(error)
    throw new Error(error)
  }

  return value
}

module.exports = {
  validateSchema,
  validateFileConfig,
  validateFileFields,
  schemas: {
    config: configSchema,
    station: stationSchema,
    depth: depthSchema,
    timestamp: timestampSchema,
    value: valueSchema,
    meta: metaSchema
  }
}
