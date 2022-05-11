const express = require('express')

const router = express.Router()

router.use('/admin', require('./admin'))
router.use('/public', require('./public'))
router.use('/restricted', require('./restricted'))

module.exports = router
