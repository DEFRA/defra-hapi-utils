const Wreck = require('@hapi/wreck')
const merge = require('lodash.merge')
const { logger } = require('defra-logging-facade')
const { getNestedVal, cloneAndMerge } = require('../utils/utils')

module.exports = class Persistence {
  constructor (options = {}) {
    merge(this, options)
  }

  async save (data) {
    const { path, serviceApi, serviceApiEnabled = true } = this

    if (!serviceApiEnabled) {
      logger.warn('Service API is Disabled')
      return data
    }

    const { id } = data
    const method = id ? 'PATCH' : 'POST'
    const uri = serviceApi + id ? `${path}/${id}` : path
    const payloadData = cloneAndMerge(data, { id: null })

    const headers = { 'Content-Type': 'application/json' }
    const payload = JSON.stringify(payloadData)

    try {
      const res = await Wreck.request(method, uri, { headers, payload })
      return Wreck.read(res, { json: true })
    } catch (error) {
      const { statusCode, message } = getNestedVal(error, 'output.payload') || {}
      logger.error(`message: ${message}, statusCode: ${statusCode}, method: ${method}, uri: ${uri}, payload: ${payload}`)
      throw error
    }
  }

  async restore (id) {
    const { path, serviceApi, serviceApiEnabled = true } = this

    if (!serviceApiEnabled) {
      logger.warn('Service API is Disabled')
      return { id }
    }

    const method = 'GET'
    const uri = serviceApi + `${path}/${id}`
    const headers = { 'Content-Type': 'application/json' }

    try {
      const res = await Wreck.request(method, uri, { headers })
      return Wreck.read(res, { json: true })
    } catch (error) {
      const { statusCode, message } = getNestedVal(error, 'output.payload') || {}
      logger.error(`message: ${message}, statusCode: ${statusCode}, method: ${method}, uri: ${uri}`)
      throw error
    }
  }
}
