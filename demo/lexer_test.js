'use strict'

const util = require('util')
const Lexer = require('../').Lexer
const Parser = require('../').Parser
const PostParser = require('../lib/postparser.js')

const filename = __dirname + '/html/extend.html'
const html = require('fs').readFileSync(filename, 'utf8')

// const lexer = new Lexer(html)
// const tokens = lexer.lex()
// console.log('-----------------')
// console.log(tokens)

console.log('----------------------')
const p = new Parser(html, filename)
const ast = p.parse()
console.log(util.inspect(ast, {
  depth: null
}))

console.log('----------------------')
new PostParser(ast)
console.log(util.inspect(ast, {
  depth: null
}))