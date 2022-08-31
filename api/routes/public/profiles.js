const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachProfile,
  getProfile,
  getProfileValues
} = require('../../controllers/profiles')

const router = express.Router()

router.route('/:profileId')
  .all(asyncHandler(attachProfile))
  .get(asyncHandler(getProfile))

router.route('/:profileId/values')
  .all(asyncHandler(attachProfile))
  .get(asyncHandler(getProfileValues))

module.exports = router
