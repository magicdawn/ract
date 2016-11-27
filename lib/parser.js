'use strict'
/* eslint brace-style: off */

const assert = require('assert')
const $clone = require('lodash/cloneDeep')
const _trim = require('lodash/trim')
const Lexer = require('./lexer.js')
const nodes = require('./nodes/')
const LocalUtil = require('./util.js')
const ractError = require('./ractSyntaxError.js').error

const Parser = module.exports = class Parser {
  constructor(input, filename, included) {
    this.input = input
    this.filename = filename
    this.lexer = new Lexer(input, filename)

    // state
    this.included = included
    this.extending = false
  }

  consume(n) {
    this.tokens = this.tokens.slice(n)
  }

  cur() {
    return this.tokens[0]
  }

  expect(type, val) {
    const tok = this.cur() || {
      type: 'eos'
    }

    // assert type
    if (tok.type !== type) {
      const msg = `unexpected token on line ${ tok.lineno }, expect ${ type } but see ${ tok.type }`
      throw this.error(msg, tok.pos) // throw new Error(msg)
    }

    // assert val
    if (val && tok.val !== val) {
      const msg = `unexpected token ${ type } value on line ${ tok.lineno }, expect ${ val } but see ${ tok.val }`
      throw this.error(msg, tok.pos) // throw new Error(msg)
    }

    return tok
  }

  parse() {
    this.originalTokens = this.lexer.lex()
    this.tokens = this.originalTokens.slice(0)
    this.file = new nodes.File(this.filename)

    while (this.tokens.length) {
      const n = this.parseFile()

      // extend
      if (n.type === 'extend') {
        this.file.extending = n.val
        this.extending = true
      }

      // block
      else if (n.type === 'block') {
        this.file.blocks = this.file.blocks || {}
        const val = LocalUtil.getName(n.val)
        const exists = this.file.blocks[val]
        if (exists) {
          throw this.error('duplicate block definition', n.pos)
        }
        this.file.blocks[val] = n
        this.file.nodes.push(n)
      }

      // 其他
      else {
        this.file.nodes.push(n)
      }
    }

    return this.file
  }

  parseFile() {
    // 正在 extending
    if (this.extending) {
      switch (this.cur().type) {
        case 'extend':
          throw this.error('u can only extend once', this.cur().pos)
        case 'block':
          return this.parseBlock()
        case 'blockDefine':
          return this.parseBlockDefine()
        case 'comment':
        case 'htmlComment':
          return this.parseChunk()
        case 'text':
          /* eslint no-fallthrough: off */
          // 允许空白
          if (!_trim(this.cur().val)) {
            return this.parseChunk()
          }
        default:
          throw this.error('unexpected token in extend mode on line ' + this.cur().lineno, this.cur().pos)
      }
    }

    // 正在被 include
    if (this.included) {
      switch (this.cur().type) {
        case 'extend':
        case 'block':
        case 'blockDefine':
          throw this.error(
            `token ${ this.cur().type } are not allowed in included files`,
            this.cur().pos
          )
        case 'comment':
        case 'htmlComment':
        case 'text':
        case 'interpolation':
        case 'code':
        case 'include':
        case 'if':
        case 'each':
          return this.parseChunk()
        default:
          throw this.error('unexpected token on line ' + this.cur().lineno, this.cur().pos)
      }
    }

    // 默认
    switch (this.cur().type) {
      case 'extend':
        return this.parseExtend()
      case 'block':
        return this.parseBlock()
      case 'blockDefine':
        return this.parseBlockDefine()
      case 'comment':
      case 'htmlComment':
      case 'text':
      case 'interpolation':
      case 'code':
      case 'include':
      case 'if':
      case 'each':
        return this.parseChunk()
      default:
        throw this.error(
          'unexpected token on line ' + this.cur().lineno,
          this.cur().pos
        )
    }
  }

  parseExtend() {
    this.expect('extend')
    const tok = this.cur()
    this.consume(1)
    return $clone(tok)
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
    block.nodes = [chunk]
    return block
  }

  parseBlockDefine() {
    const tok = this.cur()
    this.consume(1)
    return {
      type: 'block',
      val: tok.val,
      mode: 'block',
      nodes: [],
    }
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
          tok = this.cur()
          this.consume(1)
          chunk.nodes.push($clone(tok))
          continue
        case 'include':
          node = this.parseInclude()
          chunk.nodes.push(node)
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

  parseInclude() {
    this.expect('include')
    const tok = this.cur()
    this.consume(1)

    const node = $clone(tok)
    return node
  }

  parseEach() {
    this.expect('each')
    const start = this.cur()
    this.consume(1)

    const chunk = this.parseChunk()

    const end = this.expect('closeSection', 'each')
    this.consume(1)

    const each = $clone(start)
    each.nodes = [chunk]
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
      nodes: [chunk],
    })

    // elseif
    while (this.cur().type === 'elseif') {
      const tok = this.cur()
      this.consume(1)

      let elseifChunk = this.parseChunk()
      ret.nodes.push({
        type: 'elseif',
        val: tok.val,
        nodes: [elseifChunk],
      })
    }

    // else
    if (this.cur().type === 'else') {
      const tok = this.cur()
      this.consume(1)

      let elseChunk = this.parseChunk()
      ret.nodes.push({
        type: 'else',
        nodes: [elseChunk],
      })
    }

    // endif
    const end = this.expect('closeSection', 'if')
    this.consume(1)

    return ret
  }
}

Parser.prototype.error = ractError