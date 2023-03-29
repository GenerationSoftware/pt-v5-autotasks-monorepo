
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./v5-autotasks-library.cjs.production.min.js')
} else {
  module.exports = require('./v5-autotasks-library.cjs.development.js')
}
