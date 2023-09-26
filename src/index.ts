/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs'
import { Compiler } from './compiler'
import { Lexer } from './lexer'
import { Parser } from './parser'
import { PostParser } from './postparser'

export { Compiler, Lexer, Parser, PostParser }

export function parse(filename: string, included = false) {
  const input = fs.readFileSync(filename, 'utf8')
  const fileNode = new Parser(input, filename, included).parse()
  new PostParser(input, filename, fileNode)
  return fileNode
}

export function compileFile(filename: string) {
  const file = parse(filename, false)
  const compiler = new Compiler(file)
  const fn = compiler.compile()
  return fn
}

export function renderFile(filename: string, locals?: any) {
  const fn = exports.compileFile(filename)
  return fn(locals)
}
