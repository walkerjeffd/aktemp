const createError = require('http-errors')
const { Station } = require('aktemp-db/models')

const getStations = async (req, res, next) => {
  let query
  if (res.locals.public) {
    query = Station.query()
      .where('private', false)
  } else if (res.locals.provider) {
    query = res.locals.provider.$relatedQuery('stations')
  } else if (res.locals.user) {
    query = res.locals.user.$relatedQuery('providers.[stations]')
  } else {
    query = Station.query()
  }
  const stations = await query
    .modify('providerCode')
    .modify('seriesSummary')
    .modify('profilesSummary')

  return res.status(200).json(stations)
}

const attachStation = async (req, res, next) => {
  let query
  if (res.locals.provider) {
    query = res.locals.provider.$relatedQuery('stations')
      .findById(req.params.stationId)
  } else {
    query = Station.query()
      .findById(req.params.stationId)
  }
  const station = await query
    .modify('providerCode')
    .modify('seriesSummary')
    .modify('profilesSummary')

  if (!station) {
    throw createError(404, `Station (id=${req.params.stationId}) not found`)
  }

  res.locals.station = station
  return next()
}

const postStations = async (req, res, next) => {
  const row = await res.locals.provider.$relatedQuery('stations')
    .insert(req.body)
    .returning('*')
  return res.status(201).json(row)
}

const getStation = (req, res, next) => res.status(200).json(res.locals.station)

const getStationSeries = async (req, res, next) => {
  const series = await res.locals.station
    .$relatedQuery('series')
    .modify('stationProvider')
    .modify('filename')
    .withGraphFetched('flags')
  return res.status(200).json(series)
}

const getStationSeriesDaily = async (req, res, next) => {
  const values = await res.locals.station.$relatedQuery('series')
    .select('date')
    .sum('n_values as n_values')
    .min('min_temp_c as min_temp_c')
    .max('max_temp_c as max_temp_c')
    .avg('mean_temp_c as mean_temp_c')
    .joinRelated('[daily, station]')
    .where('interval', 'CONTINUOUS')
    .groupBy('date')
    .orderBy('date')
  return res.status(200).json(values)
}

const getStationSeriesDiscrete = async (req, res, next) => {
  const values = await res.locals.station.$relatedQuery('series')
    .where('interval', 'DISCRETE')
    .withGraphFetched('[flags, values]')
  return res.status(200).json(values)
}

const getStationSeriesFlags = async (req, res, next) => {
  const values = await res.locals.station.$relatedQuery('series')
    .select('flags.*')
    .where('interval', 'CONTINUOUS')
    .joinRelated('flags')
  return res.status(200).json(values)
}

const getStationProfiles = async (req, res, next) => {
  const profiles = await res.locals.station
    .$relatedQuery('profiles')
    .modify('stationProvider')
    .modify('filename')
    .modify('valuesSummary')
    .withGraphFetched('values(defaultSelect,sort)')
  return res.status(200).json(profiles)
}

const getStationProfilesValues = async (req, res, next) => {
  const profilesValues = await res.locals.station
    .$relatedQuery('profiles')
    .modify('stationProvider')
    .modify('filename')
    .modify('valuesSummary')
    .withGraphFetched('values(defaultSelect,sort)')
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
  getStationSeriesDiscrete,
  getStationSeriesFlags,
  getStationProfiles,
  getStationProfilesValues,
  putStation,
  deleteStation
}
