const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getUserOrganizations
} = require('../../controllers/organizations')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getUserOrganizations))

module.exports = router
