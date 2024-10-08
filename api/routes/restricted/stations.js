const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachStation,
  getStation,
  putStation,
  deleteStation,
  getStationSeries,
  getStationProfiles
} = require('../../controllers/stations')

const router = express.Router()

router.route('/:stationId')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStation))
  .put(asyncHandler(putStation))
  .delete(asyncHandler(deleteStation))

router.route('/:stationId/series')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationSeries))

router.route('/:stationId/profiles')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationProfiles))

module.exports = router
