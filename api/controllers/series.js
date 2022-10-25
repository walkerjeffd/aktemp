const createError = require('http-errors')

const { Series, Station } = require('aktemp-db/models')

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
  let query = res.locals.series
    .$relatedQuery('values')
    .modify('defaultSelect')
    .modify('defaultSort')
  if (req.query.start) {
    query = query.where('datetime', '>=', req.query.start)
  }
  if (req.query.end) {
    query = query.where('datetime', '<=', req.query.end)
  }
  const values = await query
  return res.status(200).json(values)
}

async function getSeriesFlags (req, res, next) {
  const flags = await res.locals.series
    .$relatedQuery('flags')
    .modify('defaultSort')
    .modify('dates')
  return res.status(200).json(flags)
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

async function postSeriesFlags (req, res, next) {
  const row = await res.locals.series.$relatedQuery('flags')
    .insert(req.body)
    .returning('*')
  return res.status(201).json(row)
}

async function putSeries (req, res, next) {
  const row = await res.locals.series.$query()
    .patchAndFetch(req.body)
  return res.status(200).json(row)
}

async function putSeriesFlag (req, res, next) {
  const flag = await res.locals.series.$relatedQuery('flags')
    .where('id', req.params.flagId)
    .first()
  if (!flag) {
    return next(createError(404, `Flag (id=${req.params.flagId}not found for series (id=${res.locals.series.id})`))
  }
  const row = await flag.$query().patchAndFetch(req.body)
  return res.status(200).json(row)
}

async function deleteSeries (req, res, next) {
  const deletedCount = await res.locals.series.$query().delete()
  if (deletedCount === 0) {
    throw createError(500, `Failed to delete series (id=${res.locals.series.id})`)
  }

  return res.status(204).json()
}

async function deleteSeriesFlag (req, res, next) {
  const flag = await res.locals.series.$relatedQuery('flags')
    .where('id', req.params.flagId)
    .first()
  if (!flag) {
    return next(createError(404, `Flag (id=${req.params.flagId}not found for series (id=${res.locals.series.id})`))
  }
  await flag.$query().delete()
  return res.status(204).json()
}

async function deleteSeriesFlags (req, res, next) {
  await res.locals.series
    .$relatedQuery('flags')
    .delete()
  return res.status(204).json()
}

module.exports = {
  attachSeries,
  getSeries,
  getSeriesValues,
  getSeriesDaily,
  getSeriesFlags,
  getOrganizationSeries,
  postSeriesFlags,
  putSeries,
  putSeriesFlag,
  deleteSeries,
  deleteSeriesFlag,
  deleteSeriesFlags
}
