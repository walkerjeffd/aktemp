const express = require('express')
const asyncHandler = require('express-async-handler')

const { requireProviderAccessOrAdmin } = require('../../middleware/auth')
const {
  getStations,
  postStations,
  attachStation,
  getStation,
  putStation,
  deleteStation,
  postStationPhoto,
  deleteStationPhoto
} = require('../../controllers/stations')
const {
  attachFile,
  getProviderFiles,
  postFiles,
  getFile,
  putFile,
  deleteFile,
  processFile
} = require('../../controllers/files')
const { getProviderSeries } = require('../../controllers/series')
const { getProviderProfiles } = require('../../controllers/profiles')

const router = express.Router({ mergeParams: true })

router.use(asyncHandler(requireProviderAccessOrAdmin))

router.route('/')
  .get((req, res) => res.status(200).json(res.locals.provider))

router.route('/stations')
  .get(asyncHandler(getStations))
  .post(asyncHandler(postStations))

router.route('/stations/:stationId')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStation))
  .put(asyncHandler(putStation))
  .delete(asyncHandler(deleteStation))

router.route('/stations/:stationId/photo')
  .all(asyncHandler(attachStation))
  .post(asyncHandler(postStationPhoto))
  .delete(asyncHandler(deleteStationPhoto))

router.route('/files')
  .get(asyncHandler(getProviderFiles))
  .post(asyncHandler(postFiles))

router.route('/files/:fileId')
  .all(asyncHandler(attachFile))
  .get(asyncHandler(getFile))
  .put(asyncHandler(putFile))
  .delete(asyncHandler(deleteFile))

router.route('/files/:fileId/process')
  .all(asyncHandler(attachFile))
  .post(asyncHandler(processFile))

router.route('/series')
  .get(asyncHandler(getProviderSeries))

router.route('/profiles')
  .get(asyncHandler(getProviderProfiles))

module.exports = router
