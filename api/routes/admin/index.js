const express = require('express')
// const { requireAdmin } = require('../../middleware/auth')

const router = express.Router()

// router.use(attachUser)
// router.use(requireAdmin)

router.get('/', function (req, res, next) {
  res.status(200).json({ api: 'admin' })
})

router.use('/organizations', require('./organizations'))
router.use('/providers', require('./providers'))
router.use('/requests', require('./requests'))
router.use('/stations', require('./stations'))
router.use('/users', require('./users'))

module.exports = router
