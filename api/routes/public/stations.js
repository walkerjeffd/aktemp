const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getStations,
  attachStation,
  getStation,
  getStationSeries,
  getStationSeriesDaily,
  getStationSeriesFlags,
  getStationProfiles,
  getStationProfilesValues
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

router.route('/:stationId/series/daily')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationSeriesDaily))

router.route('/:stationId/series/flags')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationSeriesFlags))

router.route('/:stationId/profiles')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationProfiles))

router.route('/:stationId/profiles/values')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStationProfilesValues))

module.exports = router
