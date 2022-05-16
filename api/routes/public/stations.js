const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getStations,
  attachStation,
  getStation,
  getStationSeries,
  getStationProfiles
} = require('../../controllers/stations')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getStations))

router.route('/:stationId')
  .all(asyncHandler(attachStation))
  .get(getStation)

router.route('/:stationId/series')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationSeries))

router.route('/:stationId/series/')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationSeries))

router.route('/:stationId/profiles')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationProfiles))

module.exports = router
