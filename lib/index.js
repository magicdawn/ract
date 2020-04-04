const Lexer = require('./lexer.js')
const Parser = require('./parser.js')
const PostParser = require('./postparser.js')
const Compiler = require('./compiler.js')

exports.Lexer = Lexer
exports.Parser = Parser
exports.PostParser = PostParser
exports.Compiler = Compiler

exports.compileFile = function (filename) {
  const file = Parser.parse(filename, false)
  const compiler = new Compiler(file)
  const fn = compiler.compile()
  return fn
}

exports.renderFile = function (filename, locals) {
  const fn = exports.compileFile(filename)
  return fn(locals)
}
