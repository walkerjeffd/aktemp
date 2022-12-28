
const Recaptcha = require('express-recaptcha').RecaptchaV2
const recaptcha = new Recaptcha(process.env.RECAPTCHA_SITE_KEY, process.env.RECAPTCHA_SECRET_KEY)

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
