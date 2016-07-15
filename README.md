# passwordless-cache-manager

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](http://standardjs.com) [![Build Status](https://travis-ci.org/theogravity/passwordless-cache-manager.svg?branch=master)](https://travis-ci.org/theogravity/passwordless-cache-manager) [![npm version](https://badge.fury.io/js/passwordless-cache-manager.svg)](https://badge.fury.io/js/passwordless-cache-manager)

A token store for [Passwordless](https://github.com/florianheinemann/passwordless), a node.js module for express that allows website authentication without password using verification through email or other means. 

This store implementation uses [node-cache-manager](https://github.com/BryanDonovan/node-cache-manager), which supports [multiple storage engines](https://github.com/BryanDonovan/node-cache-manager#store-engines).

Tokens are stored in memory and are hashed and salted using [bcryptjs](https://github.com/dcodeIO/bcrypt.js).

### Acknowledgements

Most of the project scaffolding is lifted from [passwordless-memorystore](https://github.com/lloydcotten/passwordless-memorystore), with modifications specific to using `node-cache-manager`.

### Usage

First, install the module:

`$ npm install cache-manager passwordless-cache-manager --save`

Afterwards, follow the guide for [Passwordless](https://github.com/florianheinemann/passwordless). A typical implementation may look like this:

```javascript
var passwordless = require('passwordless');

var cacheManager = require('cache-manager');
var CacheManagerStore = require('passwordless-cache-manager');

// Using the built-in memory store as an example. Swap this out with the specific cache-manager storage engine you need
var memoryStore = require('cache-manager/lib/stores/memory');

passwordless.init(new CacheManagerStore(cacheManager.caching({
  store: memoryStore
})));

passwordless.addDelivery(
    function(tokenToSend, uidToSend, recipient, callback) {
        // Send out a token
    });
    
app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken());
```

## Initialization

```javascript
var cacheManager = require('cache-manager');
var CacheManagerStore = require('passwordless-cache-manager');

new CacheManagerStore(cacheManager.caching({
    store: <cache-manager store>,
    // store-related options
}));
```

## Hash and salt
As the tokens are equivalent to passwords (even though they do have the security advantage of only being valid for a limited time) they have to be protected in the same way. passwordless-cache-manager uses [bcryptjs](https://github.com/dcodeIO/bcrypt.js) with automatically created random salts. To generate the salt 10 rounds are used.

## Tests

`$ npm test`

## Debugging

The `debug` module is used to log debug statements. It can be enabled via the environment variable:

`DEBUG=passwordless-cache-manager`

## License

[MIT License](http://opensource.org/licenses/MIT)
