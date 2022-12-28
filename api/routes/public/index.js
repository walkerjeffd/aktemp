const express = require('express')

const router = express.Router()

router.get('/', function (req, res, next) {
  res.status(200).json({ api: 'public' })
})

router.use('/downloads', require('./downloads'))
router.use('/organizations', require('./organizations'))
router.use('/profiles', require('./profiles'))
router.use('/requests', require('./requests'))
router.use('/series', require('./series'))
router.use('/stations', require('./stations'))
router.use('/users', require('./users'))

module.exports = router
