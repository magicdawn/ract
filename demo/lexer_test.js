;

const util = require('util')
const Lexer = require('../').Lexer
const Parser = require('../').Parser
const PostParser = require('../').PostParser
const Compiler = require('../').Compiler

const filename = __dirname + '/test.html'
const html = require('fs').readFileSync(filename, 'utf8')

// const lexer = new Lexer(html)
// const tokens = lexer.lex()
// console.log('-----------------')
// console.log(tokens)

console.log('----------------------')
const p = new Parser(html, filename)
const ast = p.parse()
new PostParser(ast)
console.log(util.inspect(ast, {
  depth: null
}))

const compiler = new Compiler(ast)
const fn = compiler.compile()
console.log(fn.toString())

console.log('------------------')
const result = fn({
  some: 'hellio',
  array: [1,2,3]
})
console.log(result)