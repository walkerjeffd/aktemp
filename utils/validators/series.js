const Joi = require('joi')
const {
  intervalOptions,
  sensorAccuracyOptions,
  depthCategoryOptions
} = require('../constants')

const createSeriesSchema = (stations) => {
  return Joi.object({
    station_id: Joi.number()
      .integer()
      .valid(...stations.map(d => d.id))
      .empty(['', null])
      .required(),
    interval: Joi.string()
      .uppercase()
      .trim()
      .allow(null)
      .empty(['', null])
      .valid(...intervalOptions.map(d => d.value))
      .required(),
    depth_m: Joi.number()
      .allow('', null)
      .empty(['', null])
      .when('interval', {
        is: 'CONTINUOUS',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      })
      .default(null),
    depth_category: Joi.string()
      .uppercase()
      .trim()
      .valid(...depthCategoryOptions.map(d => d.value))
      .allow(null)
      .empty(['', null])
      .when('interval', {
        is: 'CONTINUOUS',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      })
      .default(null),
    frequency: Joi.number()
      .integer()
      .min(0)
      .allow(null)
      .empty(['', null])
      .when('interval', {
        is: 'CONTINUOUS',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      })
      .default(null),
    sop_bath: Joi.boolean()
      .allow('', null)
      .empty(['', null])
      .when('interval', {
        is: 'CONTINUOUS',
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      })
      .default(null),
    accuracy: Joi.string()
      .valid(...sensorAccuracyOptions.map(d => d.value))
      .empty(['', null])
      .optional()
      .default(null),
    reviewed: Joi.boolean()
      .allow('', null)
      .empty(['', null])
      .default(false)
  })
}

module.exports = {
  createSeriesSchema
}
