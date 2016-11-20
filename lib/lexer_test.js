/* eslint semi: off */

const util = require('util')
const Lexer = require('./lexer.js')
const html = require('fs').readFileSync(__dirname + '/demo/test.html', 'utf8')

// const lexer = new Lexer(html)
// const tokens = lexer.lex()
// console.log('-----------------');
// console.log(tokens);

// console.log('----------------------');
const Parser = require('./parser.js')
const p = new Parser(html)
const ast = p.parse()

console.log(util.inspect(ast, {
  depth: 5
}))