const createError = require('http-errors')

const { Series, Station } = require('../db/models')

async function attachSeries (req, res, next) {
  const series = await Series.query()
    .findById(req.params.seriesId)
    .modify('stationOrganization')
    .modify('filename')

  if (!series) {
    throw createError(404, `Series (id=${req.params.seriesId}) not found`)
  }

  res.locals.series = series
  return next()
}

async function getSeries (req, res, next) {
  return res.status(200).json(res.locals.series)
}

async function getSeriesValues (req, res, next) {
  const values = await res.locals.series
    .$relatedQuery('values')
    .modify('select')
    .modify('defaultOrderBy')
  return res.status(200).json(values)
}

async function getSeriesDaily (req, res, next) {
  const values = await res.locals.series
    .$relatedQuery('values')
    .modify('daily')
  return res.status(200).json(values)
}

async function getOrganizationSeries (req, res, next) {
  const stations = await res.locals.organization.$relatedQuery('stations')
  const rows = await Station.relatedQuery('series')
    .for(stations).modify('stationOrganization')
  return res.status(200).json(rows)
}

async function putSeries (req, res, next) {
  const row = await res.locals.series.$query()
    .patchAndFetch(req.body)
  return res.status(200).json(row)
}

async function deleteSeries (req, res, next) {
  const deletedCount = await res.locals.series.$query().delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete series (id=${res.locals.series.id})`)
  }

  return res.status(204).json()
}

module.exports = {
  attachSeries,
  getSeries,
  getSeriesValues,
  getSeriesDaily,
  getOrganizationSeries,
  putSeries,
  deleteSeries
}
