const debug = require('./debug')
const Recaptcha = require('express-recaptcha').RecaptchaV2
let recaptcha

if (process.env.RECAPTCHA_SITE_KEY && process.env.RECAPTCHA_SECRET_KEY) {
  recaptcha = new Recaptcha(process.env.RECAPTCHA_SITE_KEY, process.env.RECAPTCHA_SECRET_KEY)
} else {
  debug('RECAPTCHA_SITE_KEY and RECAPTCHA_SECRET_KEY not set, recaptcha disabled')
  recaptcha = {
    verify: (req, cb) => cb(null, req)
  }
}

exports.verifyRecaptcha = (req) => {
  return new Promise((resolve, reject) => {
    recaptcha.verify(req, (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}

exports.isLambda = () => !!process.env.LAMBDA_TASK_ROOT
