const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getUsers
} = require('../../controllers/users')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getUsers))

module.exports = router
