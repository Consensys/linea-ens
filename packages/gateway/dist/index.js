
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./zkevm-resolver-gateway.cjs.production.min.js')
} else {
  module.exports = require('./zkevm-resolver-gateway.cjs.development.js')
}
