const express = require('express')
const asyncHandler = require('express-async-handler')

const { requireOrganizationOrAdmin } = require('../../middleware/auth')

const router = express.Router()

router.use(asyncHandler(requireOrganizationOrAdmin))
router.use('/stations', require('./stations'))

module.exports = router
