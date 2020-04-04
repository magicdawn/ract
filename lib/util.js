const _trim = require('lodash/trim')

exports.getName = (str) => _trim(str, ' "\'')
