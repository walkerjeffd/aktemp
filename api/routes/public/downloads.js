const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  postDownloads
} = require('../../controllers/downloads')

const router = express.Router()

router.route('/')
  .post(asyncHandler(postDownloads))

module.exports = router
