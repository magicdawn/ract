'use strict'

const ract = require('../')

const filename = __dirname + '/test.html'
const html = ract.renderFile(filename, {
  some: 'hellio',
  array: [1, 2, 3]
})

console.log(html)