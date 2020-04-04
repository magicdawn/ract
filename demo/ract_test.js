'use strict'

const ract = require('../')

const filename = __dirname + '/test.html'
const fn = ract.compileFile(filename)
console.log(fn.toString())
const html = fn({
  some: 'hellio',
  array: [1, 2, 3],
})

console.log(html)
