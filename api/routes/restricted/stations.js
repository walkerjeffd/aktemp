const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachStation,
  getStations,
  getStation,
  postStations,
  putStation,
  deleteStation
} = require('../../controllers/stations')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getStations))
  .post(asyncHandler(postStations))

router.route('/:stationId')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStation))
  .put(asyncHandler(putStation))
  .delete(asyncHandler(deleteStation))

module.exports = router
