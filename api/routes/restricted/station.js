const express = require('express')
const asyncHandler = require('express-async-handler')

const { requireStationAccessOrAdmin } = require('../../middleware/auth')

const router = express.Router()

router.use(asyncHandler(requireStationAccessOrAdmin))

router.route('/')
  .get((req, res, next) => res.status(200).json(res.locals.station))

module.exports = router
