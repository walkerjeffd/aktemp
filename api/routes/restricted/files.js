const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachFile,
  getUserFiles,
  getFile,
  putFile,
  deleteFile,
  processFile
} = require('../../controllers/files')

const router = express.Router()

router.route('/')
  .get(asyncHandler(getUserFiles))

router.route('/:fileId')
  .all(asyncHandler(attachFile))
  .get(asyncHandler(getFile))
  .put(asyncHandler(putFile))
  .delete(asyncHandler(deleteFile))

router.route('/:fileId/process')
  .all(asyncHandler(attachFile))
  .post(asyncHandler(processFile))

module.exports = router
