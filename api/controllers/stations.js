const createError = require('http-errors')

const { Station } = require('../db/models')

const getStations = async (req, res, next) => {
  let stations = []
  if (res.locals.organization) {
    stations = await res.locals.organization.$relatedQuery('stations')
  } else if (res.locals.user) {
    stations = await res.locals.user.$relatedQuery('organizations.[stations]')
  } else {
    stations = await Station.query()
  }
  return res.status(200).json(stations)
}

const attachStation = async (req, res, next) => {
  let station = null
  if (res.locals.organization) {
    station = await res.locals.organization.$relatedQuery('stations')
      .findById(req.params.stationId)
  } else {
    station = await Station.query()
      .findById(req.params.stationId)
  }

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
  return res.status(200).json(series)
}

const getStationProfiles = async (req, res, next) => {
  const profiles = await res.locals.station.$relatedQuery('profiles')
  return res.status(200).json(profiles)
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
  getStationProfiles,
  putStation,
  deleteStation
}
