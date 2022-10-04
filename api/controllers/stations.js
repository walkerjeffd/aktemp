const createError = require('http-errors')
const { raw } = require('objection')
const { Station } = require('../db/models')

const getStations = async (req, res, next) => {
  let query
  if (res.locals.organization) {
    query = res.locals.organization.$relatedQuery('stations')
  } else if (res.locals.user) {
    query = res.locals.user.$relatedQuery('organizations.[stations]')
  } else {
    query = Station.query()
  }
  const stations = await query
    .modify('organizationCode')
    .modify('seriesSummary')
    .modify('profilesSummary')

  return res.status(200).json(stations)
}

const attachStation = async (req, res, next) => {
  let query
  if (res.locals.organization) {
    query = res.locals.organization.$relatedQuery('stations')
      .findById(req.params.stationId)
  } else {
    query = Station.query()
      .findById(req.params.stationId)
  }
  const station = await query.modify('organizationCode')

  if (!station) {
    throw createError(404, `Station (id=${req.params.stationId}) not found`)
  }

  res.locals.station = station
  return next()
}

const postStations = async (req, res, next) => {
  const row = await res.locals.organization.$relatedQuery('stations')
    .insert(req.body)
    .returning('*')
  return res.status(201).json(row)
}

const getStation = (req, res, next) => res.status(200).json(res.locals.station)

const getStationSeries = async (req, res, next) => {
  const series = await res.locals.station.$relatedQuery('series')
    .modify('stationOrganization')
    .modify('filename')
  return res.status(200).json(series)
}

const getStationSeriesDaily = async (req, res, next) => {
  const values = await res.locals.station.$relatedQuery('series')
    .select(raw('to_char(values.datetime at time zone "timezone", \'YYYY-MM-DD\') as date'))
    .select(raw('count(values.*)::integer as n'))
    .min('value as min')
    .max('value as max')
    .avg('value as mean')
    .joinRelated('[values, station]')
    .groupBy('date')
    .orderBy('date')
  return res.status(200).json(values)
}

const getStationSeriesFlags = async (req, res, next) => {
  const values = await res.locals.station.$relatedQuery('series')
    .select('flags.*')
    .joinRelated('flags(dates)')
  return res.status(200).json(values)
}

const getStationProfiles = async (req, res, next) => {
  const profiles = await res.locals.station.$relatedQuery('profiles')
  return res.status(200).json(profiles)
}

const getStationProfilesValues = async (req, res, next) => {
  const profilesValues = await res.locals.station.$relatedQuery('profiles')
    .withGraphFetched('values(defaultSelect)')
  return res.status(200).json(profilesValues)
}

const putStation = async (req, res, next) => {
  const row = await res.locals.station.$query()
    .patchAndFetch(req.body)
  return res.status(200).json(row)
}

const deleteStation = async (req, res, next) => {
  const deletedCount = await res.locals.station.$query()
    .delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete station (id=${res.locals.station.id})`)
  }

  return res.status(204).json()
}

module.exports = {
  getStations,
  postStations,
  attachStation,
  getStation,
  getStationSeries,
  getStationSeriesDaily,
  getStationSeriesFlags,
  getStationProfiles,
  getStationProfilesValues,
  putStation,
  deleteStation
}
