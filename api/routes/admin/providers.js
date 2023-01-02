const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getProviders,
  postProviders,
  attachProvider,
  getProvider,
  putProvider,
  deleteProvider
} = require('../../controllers/admin/providers')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getProviders))
  .post(asyncHandler(postProviders))

router.route('/:providerId')
  .all(asyncHandler(attachProvider))
  .get(asyncHandler(getProvider))
  .put(asyncHandler(putProvider))
  .delete(asyncHandler(deleteProvider))

module.exports = router
