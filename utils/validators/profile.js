const Joi = require('joi')
const {
  sensorAccuracyOptions
} = require('../constants')

const createProfileSchema = (stations) => {
  return Joi.object({
    station_id: Joi.number()
      .integer()
      .valid(...stations.map(d => d.id))
      .empty(['', null])
      .required(),
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
  createProfileSchema
}
