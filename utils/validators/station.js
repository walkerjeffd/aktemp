const Joi = require('joi')
const { constraints, stationTimezoneOptions, placementOptions, waterbodyTypeOptions } = require('../constants')

const stationSchema = Joi.object({
  provider_id: Joi.number()
    .integer()
    .empty('')
    .optional(),
  code: Joi.string()
    .trim()
    .min(1)
    .max(constraints.station.code.maxLength)
    .empty(['', null])
    .required(),
  description: Joi.string()
    .trim()
    .max(constraints.station.description.maxLength)
    .empty(['', null])
    .optional(),
  latitude: Joi.number()
    .min(constraints.station.latitude.min)
    .max(constraints.station.latitude.max)
    .unsafe()
    .required(),
  longitude: Joi.number()
    .min(constraints.station.longitude.min)
    .max(constraints.station.longitude.max)
    .unsafe()
    .required(),
  timezone: Joi.string()
    .trim()
    .valid(...stationTimezoneOptions.map(d => d.value))
    .required(),
  placement: Joi.string()
    .uppercase()
    .trim()
    .valid(...placementOptions.map(d => d.value))
    .empty(['', null])
    .optional(),
  waterbody_name: Joi.string()
    .trim()
    .max(constraints.station.waterbody_name.maxLength)
    .empty(['', null])
    .optional(),
  waterbody_type: Joi.string()
    .uppercase()
    .trim()
    .valid(...waterbodyTypeOptions.map(d => d.value))
    .allow(null)
    .empty(['', null])
    .optional(),
  active: Joi.boolean()
    .allow(null)
    .empty(['', null])
    .optional(),
  mixed: Joi.boolean()
    .allow(null)
    .empty(['', null])
    .optional(),
  reference: Joi.string()
    .trim()
    .empty(['', null])
    .optional(),
  private: Joi.boolean()
    .empty(['', null])
    .default(false)
    .optional()
})

module.exports = {
  stationSchema
}
