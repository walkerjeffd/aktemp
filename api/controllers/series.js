const createError = require('http-errors')

const { Series } = require('../db/models')

const attachSeries = async (req, res, next) => {
  const series = await Series.query()
    .findById(req.params.seriesId)
    .withGraphFetched('values(select,orderByDatetime)')
    .modifiers({
      select: builder => {
        builder.select(['datetime', 'value'])
      },
      orderByDatetime: builder => {
        builder.orderBy('datetime')
      }
    })

  if (!series) {
    throw createError(404, `Series (id=${req.params.seriesId}) not found`)
  }

  res.locals.series = series
  return next()
}

const getSeries = async (req, res, next) => {
  return res.status(200).json(res.locals.series)
}

module.exports = {
  attachSeries,
  getSeries
}
