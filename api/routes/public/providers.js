const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getProviders
} = require('../../controllers/providers')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getProviders))

module.exports = router
