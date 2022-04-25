const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  getOrganizations,
  postOrganizations,
  attachOrganization,
  getOrganization,
  putOrganization,
  deleteOrganization
} = require('../../controllers/admin/organizations')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getOrganizations))
  .post(asyncHandler(postOrganizations))

router.route('/:organizationId')
  .all(asyncHandler(attachOrganization))
  .get(asyncHandler(getOrganization))
  .put(asyncHandler(putOrganization))
  .delete(asyncHandler(deleteOrganization))

module.exports = router
