const express = require('express')
const db = require('aktemp-db')

const router = express.Router()

router.use((req, res, next) => {
  res.locals.public = true
  next()
})

router.get('/', function (req, res, next) {
  res.status(200).json({ api: 'public' })
})

router.use('/stats', async function (req, res, next) {
  const providers = await db.raw('SELECT COUNT(*) FROM providers').then(d => +d.rows[0].count)
  const stations = await db.raw('SELECT COUNT(*) FROM stations').then(d => +d.rows[0].count)
  const seriesValues = await db.raw('SELECT SUM(n_values) as sum FROM series').then(d => +d.rows[0].sum)
  const profilesValues = await db.raw('SELECT SUM(n_values) as sum FROM profiles').then(d => +d.rows[0].sum)
  res.status(200).json({ providers, stations, values: seriesValues + profilesValues })
})
router.use('/downloads', require('./downloads'))
router.use('/providers', require('./providers'))
router.use('/profiles', require('./profiles'))
router.use('/requests', require('./requests'))
router.use('/series', require('./series'))
router.use('/stations', require('./stations'))
router.use('/users', require('./users'))

module.exports = router
