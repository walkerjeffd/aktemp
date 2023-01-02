const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getUserProviders
} = require('../../controllers/providers')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getUserProviders))

module.exports = router
