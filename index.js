var bcrypt = require('bcryptjs')
var TokenStore = require('passwordless-tokenstore')
var debug = require('debug')('passwordless-cache-manager')

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
    debug('[auth] missing params uid: %s, token: %s', uid, token)
    throw new Error('TokenStore:authenticate called with invalid parameters')
  }

  debug('[auth] fetching user: %s, token: %s', uid, token)

  this._cache.get(uid, function (err, item) {
    if (err) {
      debug('[auth.get] storage error - user: %s, token: %s', uid, token)
      return callback(err, false, null)
    }

    if (!item) {
      debug('[auth.get] could not get data - user: %s, token: %s', uid, token)
      return callback(null, false, null)
    }

    this._validateToken(token, item, callback)
  }.bind(this))
}

CacheManagerStore.prototype._validateToken = function (token, storedItem, callback) {
  if (storedItem && storedItem.ttl) {
    const storedDate = storedItem.ttl
    const currDate = new Date()

    if (storedDate >= currDate.getTime()) {
      debug('[validateToken] comparing against hashed token: %s, hashed: %s', token, storedItem.hashedToken)

      bcrypt.compare(token, storedItem.hashedToken, function (err, res) {
        if (err) {
          debug('[validateToken] bcrypt error token: %s', token)
          return callback(err, false, null)
        }

        if (res) {
          debug('[validateToken] validation success token: %s', token)
          return callback(null, true, storedItem.originUrl || '')
        }

        debug('[validateToken] bcrypt compare failure token: %s', token)
        return callback(null, false, null)
      })

      return
    }

    debug('[validateToken] expired token: %s, expDate: %s, now: %s, result: %s', token, storedDate, currDate, (storedDate > currDate))
  }

  callback(null, false, null)
}

CacheManagerStore.prototype.storeOrUpdate = function (token, uid, msToLive, originUrl, callback) {
  if (!token || !uid || !msToLive || !callback) {
    debug('[storeOrUpdate] missing params uid: %s, token: %s, msToLive: %s', uid, token, msToLive)
    throw new Error('TokenStore:storeOrUpdate called with invalid parameters')
  }

  debug('[storeOrUpdate] hashing uid: %s, token: %s', uid, token)
  bcrypt.hash(token, 10, function (err, hashedToken) {
    if (err) {
      debug('[storeOrUpdate] bcrypt error uid: %s, token: %s', uid, token)
      return callback(err)
    }

    var newRecord = {
      hashedToken: hashedToken,
      uid: uid,
      ttl: (new Date(Date.now() + msToLive)).getTime(),
      originUrl: originUrl
    }

    var seconds = Math.ceil(msToLive / 1000)

    debug('[storeOrUpdate] setting hash uid: %s, token: %s', uid, token)
    this._cache.set(uid, newRecord, { ttl: seconds }, function (err) {
      if (err) {
        debug('[storeOrUpdate] storage error uid: %s, token: %s', uid, token)
        return callback(err, false, null)
      }

      debug('[storeOrUpdate] token stored uid: %s, token: %s', uid, token)
      callback()
    })
  }.bind(this))
}

CacheManagerStore.prototype.invalidateUser = function (uid, callback) {
  if (!uid || !callback) {
    debug('[invalidateUser] missing param uid')
    throw new Error('TokenStore:invalidateUser called with invalid parameters')
  }

  debug('[invalidateUser] deleting token uid: %s', uid)
  this._cache.del(uid, function (err) {
    if (err) {
      debug('[invalidateUser] storage error uid: %s', uid)
      return callback(err, false, null)
    }

    debug('[invalidateUser] token invalidated uid: %s', uid)
    callback()
  })
}

CacheManagerStore.prototype.clear = function (callback) {
  if (!callback) {
    throw new Error('TokenStore:clear called with invalid parameters')
  }

  debug('[clear] resetting storage')
  this._cache.reset(function (err) {
    if (err) {
      debug('[clear] storage error in resetting')
      return callback(err, false, null)
    }

    debug('[clear] storage has been cleared')
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
