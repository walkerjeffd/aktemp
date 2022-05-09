const express = require('express')
const asyncHandler = require('express-async-handler')

const { requireOrganizationAccessOrAdmin } = require('../../middleware/auth')
const {
  getStations,
  postStations,
  attachStation,
  getStation,
  putStation,
  deleteStation
} = require('../../controllers/stations')
const {
  attachFile,
  getOrganizationFiles,
  postFiles,
  getFile,
  putFile,
  deleteFile,
  processFile
} = require('../../controllers/files')
const { getOrganizationSeries } = require('../../controllers/series')

const router = express.Router()

router.use(asyncHandler(requireOrganizationAccessOrAdmin))

router.route('/')
  .get((req, res) => res.status(200).json(res.locals.organization))

router.route('/stations')
  .get(asyncHandler(getStations))
  .post(asyncHandler(postStations))

router.route('/stations/:stationId')
  .all(asyncHandler(attachStation))
  .get(asyncHandler(getStation))
  .put(asyncHandler(putStation))
  .delete(asyncHandler(deleteStation))

router.route('/files')
  .get(asyncHandler(getOrganizationFiles))
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
  .get(asyncHandler(getOrganizationSeries))

module.exports = router
