const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getFlagTypes
} = require('../../controllers/flagTypes')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getFlagTypes))

module.exports = router
