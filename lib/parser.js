'use strict'

const Lexer = require('./lexer.js')
const nodes = require('./nodes/')
const $clone = require('lodash/cloneDeep')

module.exports = class Parser {
  constructor(str, filename) {
    this.lexer = new Lexer(str, filename)
  }

  consume(n) {
    this.tokens = this.tokens.slice(n)
  }

  cur() {
    return this.tokens[0]
  }

  expect(type, val) {
    const tok = this.cur()

    // assert type
    if (tok.type !== type) {
      const msg = `unexpected token on line ${ tok.lineno }, expect ${ type } but see ${ tok.type }`
      throw this.lexer.error(msg, tok.pos) // throw new Error(msg)
    }

    // assert val
    if (val && tok.val !== val) {
      const msg = `unexpected token ${ type } value on line ${ tok.lineno }, expect ${ val } but see ${ tok.val }`
      throw this.lexer.error(msg, tok.pos) // throw new Error(msg)
    }

    return tok
  }

  parse() {
    this.originalTokens = this.lexer.lex()
    this.tokens = this.originalTokens.slice(0)

    const node = new nodes.File(this.lexer.filename)
    while (this.tokens.length) {
      const n = this.parseFile()

      // extend
      if (n.name === 'extend') {
        node.extend = n.val
      } else {
        node.nodes.push(n)
      }
    }
    return node
  }

  parseFile() {
    switch (this.cur().type) {
      case 'extend':
        return this.parseExtend()
      case 'block':
        return this.parseBlock()
      case 'comment':
      case 'htmlComment':
      case 'text':
      case 'interpolation':
      case 'code':
      case 'include':
      case 'blockDefine':
      case 'if':
      case 'each':
        return this.parseChunk()
      default:
        throw new Error('unexpected token on line ' + this.cur().lineno)
    }
  }

  parseExtend() {
    if (this.cur().type === 'extend') {
      const tok = this.cur()
      if (this.originalTokens.indexOf(tok) !== 0) {
        const msg = `extend must be placed at the begining of the file, unexpected extend in line ${ tok.lineno }`
        throw this.lexer.error(msg, tok.pos)
      }
      this.consume(1)
      return $clone(tok)
    }
  }

  parseBlock() {
    // start
    const start = this.cur()
    const mode = start.mode
    this.consume(1)

    // chunk
    const chunk = this.parseChunk()

    // end
    const end = this.expect('closeSection', mode)
    this.consume(1)

    const block = $clone(start)
    block.chunk = chunk
    return block
  }

  parseChunk() {
    const chunk = {
      type: 'chunk',
      nodes: [],
    }

    let tok, node
    out: while (this.tokens.length) {
      switch (this.cur().type) {
        case 'comment':
        case 'htmlComment':
        case 'text':
        case 'interpolation':
        case 'code':
        case 'include':
        case 'blockDefine':
          tok = this.cur()
          this.consume(1)
          chunk.nodes.push($clone(tok))
          continue
        case 'if':
          node = this.parseIf()
          chunk.nodes.push(node)
          continue
        case 'each':
          node = this.parseEach()
          chunk.nodes.push(node)
          continue
        default:
          break out
      }
    }
    return chunk
  }

  parseEach() {
    this.expect('each')
    const start = this.cur()
    this.consume(1)

    const chunk = this.parseChunk()

    const end = this.expect('closeSection', 'each')
    this.consume(1)

    const each = $clone(start)
    each.chunk = chunk
    return each
  }

  parseIf() {
    const ret = {
      type: 'if',
      nodes: [],
    }

    // if
    this.expect('if')
    const start = this.cur()
    this.consume(1)

    // if chunk
    const chunk = this.parseChunk()
    ret.nodes.push({
      type: 'if',
      val: start.val,
      chunk,
    })

    // elseif
    while (this.cur().type === 'elseif') {
      const tok = this.cur()
      this.consume(1)

      let elseifChunk = this.parseChunk()
      ret.nodes.push({
        type: 'elseif',
        val: tok.val,
        chunk: elseifChunk,
      })
    }

    // else
    if (this.cur().type === 'else') {
      const tok = this.cur()
      this.consume(1)

      let elseChunk = this.parseChunk()
      ret.nodes.push({
        type: 'else',
        chunk: elseChunk,
      })
    }

    // endif
    const end = this.expect('closeSection', 'if')
    this.consume(1)

    return ret
  }
}