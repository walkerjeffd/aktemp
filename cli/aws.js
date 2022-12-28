const AWS = require('aws-sdk')
const { luxon, formatTimestamp } = require('aktemp-utils/time')

const s3 = exports.s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.REGION
})

exports.s3GetFilesize = async function (bucket, key) {
  const params = { Key: key, Bucket: bucket }
  const response = await s3.headObject(params).promise()
  return response.ContentLength
}

exports.batch = new AWS.Batch({
  apiVersion: '2016-08-10',
  region: process.env.REGION
})

const ses = exports.ses = new AWS.SES({
  apiVersion: '2010-12-01',
  region: process.env.REGION
})

exports.sendDownloadEmail = async (download) => {
  const prettyBytes = await import('pretty-bytes')

  if (!download.config || !download.config.email) {
    throw new Error('Download request is missing recipient email')
  }
  const email = download.config.email
  const body = `The data you requested from AKTEMP is ready for download.

Request ID: ${download.id}
Requested at: ${formatTimestamp(luxon.DateTime.fromJSDate(new Date(download.created_at)), 'D t ZZZZ', 'US/Alaska')}
File size: ${prettyBytes.default(download.size)}
File URL: ${download.url}

This link will expire in 30 days.

If you are unable to download a file of this size, please return to the Data Explorer (https://aktemp.uaa.alaska.edu/#explorer) to try fewer stations. For technical assistance, please email jeff@walkerenvres.com.
  `
  const params = {
    Destination: {
      ToAddresses: [email]
    },
    Message: {
      Body: {
        Html: {
          Data: body.split('\n').join('<br />')
        },
        Text: {
          Data: body
        }
      },
      Subject: {
        Data: `AKTEMP Download Request ${download.id} is Ready`
      }
    },
    Source: 'jeff@walkerenvres.com'
  }
  return ses.sendEmail(params).promise()
}
