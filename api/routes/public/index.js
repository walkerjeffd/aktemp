const express = require('express')

const router = express.Router()

router.get('/', function (req, res, next) {
  res.status(200).json({ message: 'Welcome to the AKTEMP API (public)' })
})

router.use('/organizations', require('./organizations'))
router.use('/series', require('./series'))
router.use('/stations', require('./stations'))
router.use('/users', require('./users'))

module.exports = router
