const { logger } = require('defra-logging-facade')
const wreck = require('@hapi/wreck')
const joi = require('@hapi/joi')

module.exports = class Payment {
  constructor (config) {
    const schema = {
      paymentsUrl: joi.string().uri().required(),
      apiKey: joi.string().required(),
      amount: joi.number().required(),
      reference: joi.string().required(),
      description: joi.string().required(),
      returnUrl: joi.string().uri().required()
    }

    // Validate the config
    const { value, error } = joi.validate(config, schema, {
      abortEarly: false
    })

    // Throw if config is invalid
    if (error) {
      throw new Error(`The payment config is invalid. ${error.message}`)
    }

    Object.assign(this, value)
  }

  requestOptions () {
    // eslint-disable-next-line camelcase
    const { apiKey, amount, reference, description, returnUrl: return_url } = this
    const payload = {
      amount,
      reference,
      description,
      language: 'en',
      return_url,
      delayed_capture: false
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    return { payload, headers }
  }

  // eslint-disable-next-line camelcase
  async requestPayment () {
    const { paymentsUrl, amount, reference } = this
    logger.info(`Requesting payment of £${amount} for reference ${reference}`)

    // Call the payment service
    const res = await wreck.request('POST', paymentsUrl, this.requestOptions())
    const responseBody = await wreck.read(res, { json: true })

    const { code, description } = responseBody
    if (code) {
      responseBody.message = `${code}: ${description}`
      logger.error(responseBody.message)
    }
    return responseBody
  }
}
