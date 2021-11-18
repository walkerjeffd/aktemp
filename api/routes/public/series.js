const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachSeries,
  getSeries
} = require('../../controllers/series')

const router = express.Router()

router.route('/:seriesId')
  .all(asyncHandler(attachSeries))
  .get(asyncHandler(getSeries))

module.exports = router
