const AWS = require('aws-sdk')

exports.s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.AWS_REGION_
})

exports.batch = new AWS.Batch({
  apiVersion: '2016-08-10',
  region: process.env.AWS_REGION_
})
