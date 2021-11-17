const express = require('express')

const router = express.Router()

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the AKTEMP API (public)' })
})

router.use('/stations', require('./stations'))

module.exports = router
