const AWS = require('aws-sdk')
const debug = require('./debug')

const sns = new AWS.SNS({
  apiVersion: '2010-03-31',
  region: process.env.REGION
})

exports.cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.REGION
})

exports.notify = async (subject, message) => {
  if (!process.env.NOTIFY_TOPIC) {
    debug('aws.notify(): no topic')
    return
  }
  const params = {
    TopicArn: process.env.NOTIFY_TOPIC,
    Subject: `[AKTEMP] ${subject}`,
    Message: message
  }
  debug(`aws.notify(): start(TopicArn=${params.TopicArn}, subject="${subject}")`)

  const response = await sns.publish(params).promise()

  return response
}

exports.s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.REGION
})

exports.batch = new AWS.Batch({
  apiVersion: '2016-08-10',
  region: process.env.REGION
})

exports.createPresignedPostPromise = (params) => {
  return new Promise((resolve, reject) => {
    exports.s3.createPresignedPost(params, (err, data) => {
      if (err) return reject(err)
      return resolve(data)
    })
  })
}
