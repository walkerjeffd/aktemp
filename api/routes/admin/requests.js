const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getRequests
} = require('../../controllers/admin/requests')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getRequests))

module.exports = router
