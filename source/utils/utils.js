const uuid = require('uuid/v4')
const { transform, isEqual, isObject } = require('lodash')

const utils = {
  // Usage: const val = getNestedVal(myObj, 'a.b.c')
  getNestedVal (nestedObj, path) {
    return path
      .split('.')
      .reduce((obj, key) => {
        return (obj && obj[key] !== 'undefined') ? obj[key] : undefined
      }, nestedObj)
  },

  cloneAndMerge (...args) {
    const obj = Object.assign({}, ...args)
    Object.entries(obj).forEach(([prop, val]) => {
      if (val === null) {
        delete obj[prop]
      }
    })
    return obj
  },

  uuid () {
    return uuid()
  },

  difference (current, previous) {
    return transform(current, (result, value, key) => {
      if (!isEqual(value, previous[key])) {
        result[key] = isObject(value) && isObject(previous[key]) ? utils.difference(value, previous[key]) : value
      }
    })
  },

  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  async until (fn) {
    while (!fn()) {
      await utils.sleep(0)
    }
  }
}

module.exports = utils
