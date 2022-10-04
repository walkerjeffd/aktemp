const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getOrganizations
} = require('../../controllers/organizations')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getOrganizations))

module.exports = router
