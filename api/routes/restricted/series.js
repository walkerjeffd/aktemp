const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachSeries,
  getSeries,
  getSeriesValues,
  putSeries,
  deleteSeries
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

module.exports = router
