const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachSeries,
  getSeries,
  getSeriesValues,
  getSeriesDaily,
  getSeriesFlags,
  postSeriesFlags,
  putSeries,
  putSeriesFlag,
  deleteSeries,
  deleteSeriesFlag,
  deleteSeriesFlags
} = require('../../controllers/series')

const router = express.Router()

router.route('/:seriesId')
  .all(asyncHandler(attachSeries))
  .get(asyncHandler(getSeries))
  .put(asyncHandler(putSeries))
  .delete(asyncHandler(deleteSeries))

router.route('/:seriesId/values')
  .all(asyncHandler(attachSeries))
  .get(asyncHandler(getSeriesValues))

router.route('/:seriesId/daily')
  .all(asyncHandler(attachSeries))
  .get(asyncHandler(getSeriesDaily))

router.route('/:seriesId/flags')
  .all(asyncHandler(attachSeries))
  .get(asyncHandler(getSeriesFlags))
  .post(asyncHandler(postSeriesFlags))
  .delete(asyncHandler(deleteSeriesFlags))

router.route('/:seriesId/flags/:flagId')
  .all(asyncHandler(attachSeries))
  .put(asyncHandler(putSeriesFlag))
  .delete(asyncHandler(deleteSeriesFlag))

module.exports = router
