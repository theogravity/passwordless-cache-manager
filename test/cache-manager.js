/*global describe, beforeEach, afterEach, it */

var uuid = require('node-uuid')
var Chance = require('chance')
var chance = new Chance()
var expect = require('chai').expect

var CacheManagerStore = require('../index')
var cacheManager = require('cache-manager')
var memoryStore = require('cache-manager/lib/stores/memory')
var standardTests = require('passwordless-tokenstore-test')

function TokenStoreFactory () {
  return new CacheManagerStore(cacheManager.caching({
    store: memoryStore
  }))
}

function beforeEachTest (done) {
  done()
}

function afterEachTest (done) {
  done()
}

standardTests(TokenStoreFactory, beforeEachTest, afterEachTest, 450)

describe('Specific tests', function () {
  beforeEach(beforeEachTest)
  afterEach(afterEachTest)

  it('should store tokens only in their hashed form', function (done) {
    var store = TokenStoreFactory()
    var token = uuid.v4()
    var uid = chance.email()
    var ttl = 1000 * 60
    var originUrl = 'http://' + chance.domain() + '/page.html'

    store.storeOrUpdate(token, uid, ttl, originUrl, function () {
      store._cache.get(uid, function (err, item) {
        if (err) {
          console.error(err)
        }

        expect(item.uid).to.equal(uid)
        expect(item.hashedToken).to.not.equal(token)
        done()
      })
    })
  })

  it('should store tokens not only hashed but also salted', function (done) {
    var store = TokenStoreFactory()
    var token = uuid.v4()
    var uid = chance.email()
    var ttl = 1000 * 60
    var originUrl = 'http://' + chance.domain() + '/page.html'

    store.storeOrUpdate(token, uid, ttl, originUrl, function () {
      store._cache.get(uid, function (err, item) {
        if (err) {
          console.error(err)
        }

        var hashedToken1 = item.hashedToken

        store.clear(function () {
          store.storeOrUpdate(token, uid, ttl, originUrl, function () {
            store._cache.get(uid, function (err, item) {
              if (err) {
                console.error(err)
              }

              var hashedToken2 = item.hashedToken
              expect(hashedToken2).to.not.equal(hashedToken1)
              done()
            })
          })
        })
      })
    })
  })
})
