var bcrypt = require('bcryptjs')
var TokenStore = require('passwordless-tokenstore')

/**
 * @param {Object} cache Store instance returned from _cacheManager.(multi)caching
 * @constructor
 */
function CacheManagerStore (cache) {
  TokenStore.call(this)

  if (!cache) {
    throw new Error('CacheManagerStore requires an instance of _cacheManager.(multi)caching')
  }

  this._cache = cache
}

CacheManagerStore.prototype.authenticate = function (token, uid, callback) {
  if (!token || !uid || !callback) {
    throw new Error('TokenStore:authenticate called with invalid parameters')
  }

  this._cache.get(uid, function (err, item) {
    if (err) {
      return callback(err, false, null)
    }

    if (!item) {
      return callback(null, false, null)
    }

    this._validateToken(token, item, callback)
  }.bind(this))
}

CacheManagerStore.prototype._validateToken = function (token, storedItem, callback) {
  if (storedItem && storedItem.ttl > new Date()) {
    bcrypt.compare(token, storedItem.hashedToken, function (err, res) {
      if (err) {
        return callback(err, false, null)
      }

      if (res) {
        return callback(null, true, storedItem.originUrl || '')
      }

      callback(null, false, null)
    })
  } else {
    callback(null, false, null)
  }
}

CacheManagerStore.prototype.storeOrUpdate = function (token, uid, msToLive, originUrl, callback) {
  if (!token || !uid || !msToLive || !callback) {
    throw new Error('TokenStore:storeOrUpdate called with invalid parameters')
  }

  bcrypt.hash(token, 10, function (err, hashedToken) {
    if (err) {
      return callback(err)
    }

    var newRecord = {
      hashedToken: hashedToken,
      uid: uid,
      ttl: new Date(Date.now() + msToLive),
      originUrl: originUrl
    }

    var seconds = Math.floor(msToLive / 1000)

    this._cache.set(uid, newRecord, { ttl: seconds }, function (err) {
      if (err) {
        return callback(err, false, null)
      }

      callback()
    })
  }.bind(this))
}

CacheManagerStore.prototype.invalidateUser = function (uid, callback) {
  if (!uid || !callback) {
    throw new Error('TokenStore:invalidateUser called with invalid parameters')
  }

  this._cache.del(uid, function (err) {
    if (err) {
      return callback(err, false, null)
    }

    callback()
  })
}

CacheManagerStore.prototype.clear = function (callback) {
  if (!callback) {
    throw new Error('TokenStore:clear called with invalid parameters')
  }

  this._cache.reset(function (err) {
    if (err) {
      return callback(err, false, null)
    }

    callback()
  })
}

CacheManagerStore.prototype.length = function (callback) {
  this._cache.keys(function (err, keys) {
    if (err) {
      return callback(err, false, null)
    }

    callback(null, keys.length)
  })
}

module.exports = CacheManagerStore
