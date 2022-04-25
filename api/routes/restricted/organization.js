const express = require('express')
const asyncHandler = require('express-async-handler')
const createError = require('http-errors')

const { requireOrganizationAccessOrAdmin } = require('../../middleware/auth')
const { Station } = require('../../db/models')

const router = express.Router()

router.use(asyncHandler(requireOrganizationAccessOrAdmin))

router.route('/stations')
  .post(asyncHandler(async (req, res, next) => {
    const row = await res.locals.organization.$relatedQuery('stations')
      .insert(req.body)
      .returning('*')
    return res.status(201).json(row)
  }))

router.route('/files')
  .post(asyncHandler(async (req, res, next) => {
    const row = await res.locals.organization.$relatedQuery('files')
      .insert(req.body)
      .returning('*')
    return res.status(201).json(row)
  }))

router.route('/stations/:stationId')
  .put(asyncHandler(async (req, res, next) => {
    const row = await Station.query().patchAndFetchById(req.params.stationId, req.body)
    return res.status(200).json(row)
  }))
  .delete(asyncHandler(async (req, res, next) => {
    const deletedCount = await await Station.query().deleteById(req.params.stationId)
    if (deletedCount === 0) {
      throw createError(500, `Failed to delete station (id = ${req.params.stationId})`)
    }
    return res.status(204).json()
  }))

module.exports = router
