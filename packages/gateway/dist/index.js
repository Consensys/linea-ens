
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./linea-resolver-gateway.cjs.production.min.js')
} else {
  module.exports = require('./linea-resolver-gateway.cjs.development.js')
}
