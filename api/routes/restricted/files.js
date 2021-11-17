const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachFile,
  postFiles,
  putFile,
  deleteFile
} = require('../../controllers/files')

const router = express.Router()

router.route('/')
  .post(asyncHandler(postFiles))

router.route('/:fileId')
  .all(asyncHandler(attachFile))
  .put(asyncHandler(putFile))
  .delete(asyncHandler(deleteFile))

module.exports = router
