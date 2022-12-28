const createError = require('http-errors')

const { Profile, Station } = require('aktemp-db/models')

async function attachProfile (req, res, next) {
  const profile = await Profile.query()
    .findById(req.params.profileId)
    .modify('stationOrganization')
    .modify('filename')

  if (!profile) {
    throw createError(404, `Profile (id=${req.params.profileId}) not found`)
  }

  res.locals.profile = profile
  return next()
}

async function getProfile (req, res, next) {
  return res.status(200).json(res.locals.profile)
}

async function getProfileValues (req, res, next) {
  const values = await res.locals.profile
    .$relatedQuery('values')
    .modify('defaultSelect')
    .modify('sort')
  return res.status(200).json(values)
}

async function getOrganizationProfiles (req, res, next) {
  const stations = await res.locals.organization.$relatedQuery('stations')
  const rows = await Station.relatedQuery('profiles')
    .for(stations).modify('stationOrganization')
  return res.status(200).json(rows)
}

async function putProfile (req, res, next) {
  const row = await res.locals.profile.$query()
    .patchAndFetch(req.body)
  return res.status(200).json(row)
}

async function deleteProfile (req, res, next) {
  const deletedCount = await res.locals.profile.$query().delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete profile (id=${res.locals.profile.id})`)
  }

  return res.status(204).json()
}

module.exports = {
  attachProfile,
  getProfile,
  getProfileValues,
  getOrganizationProfiles,
  putProfile,
  deleteProfile
}
