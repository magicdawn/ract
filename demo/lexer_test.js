'use strict'

const util = require('util')
const Lexer = require('../').Lexer
const Parser = require('../').Parser

const html = require('fs').readFileSync(__dirname + '/test.html', 'utf8')

// const lexer = new Lexer(html)
// const tokens = lexer.lex()
// console.log('-----------------')
// console.log(tokens)

console.log('----------------------')
const p = new Parser(html)
const ast = p.parse()
console.log(util.inspect(ast, {
  depth: 5
}))