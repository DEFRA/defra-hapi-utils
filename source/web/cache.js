class Cache {
  static async get (request, key) {
    if (typeof key === 'string') {
      return request.yar.get(key)
    }
    // Retrieve each item specified in the array of keys
    // usage: const [a, b, c] = await utils.getCache(request, ['a', 'b', 'c'])
    return Promise.all(key.map(async (key) => {
      return Cache.get(request, key)
    }))
  }

  static async set (request, key, val) {
    return request.yar.set(key, val)
  }

  static async clear (request) {
    return request.yar.reset()
  }
}

module.exports = Cache
