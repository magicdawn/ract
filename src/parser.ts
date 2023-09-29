/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint brace-style: off */

import { cloneDeep } from 'lodash-es'
import { Lexer, Token, TokenType } from './lexer'
import { FileNode } from './nodes'
import { ractError } from './ractSyntaxError'
import { getName } from './util'

export class Parser {
  input: string
  filename: string
  lexer: Lexer
  included = false
  extending = false
  tokens: Token[]
  originalTokens: Token[]
  fileNode: FileNode

  constructor(input: string, filename: string, included?: boolean) {
    this.input = input
    this.filename = filename
    this.lexer = new Lexer(input, filename)
    // state
    this.included = included || false
  }

  error = ractError

  consume(n: number) {
    this.tokens = this.tokens.slice(n)
  }

  cur() {
    return (
      this.tokens.at(0) || {
        type: 'eos',
        pos: this.input.length - 1,
        lineno: this.input.split(/\n/).length,
        val: undefined,
      }
    )
  }

  expect(type: TokenType, val?: any) {
    const tok = this.cur()

    // assert type
    if (tok.type !== type) {
      const msg = `unexpected token on line ${tok.lineno}, expect ${type} but see ${tok.type}`
      throw this.error(msg, tok.pos) // throw new Error(msg)
    }

    // assert val
    if (val && tok.val !== val) {
      const msg = `unexpected token ${type} value on line ${tok.lineno}, expect ${val} but see ${tok.val}`
      throw this.error(msg, tok.pos) // throw new Error(msg)
    }

    return tok
  }

  parse() {
    this.originalTokens = this.lexer.lex()
    this.tokens = this.originalTokens.slice(0)
    this.fileNode = new FileNode(this.filename)

    while (this.tokens.length) {
      const n = this.parseFile()

      // extend
      if (n.type === 'extend') {
        this.fileNode.extending = n.val
        this.extending = true
      }

      // block
      else if (n.type === 'block') {
        this.fileNode.blocks ||= {}
        const val = getName(n.val)
        const exists = this.fileNode.blocks[val]
        if (exists) {
          // @ts-ignore
          throw this.error('duplicate block definition ' + n.val, n.pos)
        }
        this.fileNode.blocks[val] = n
        this.fileNode.nodes.push(n)
      }

      // 其他
      else {
        this.fileNode.nodes.push(n)
      }
    }

    return this.fileNode
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
          if (!(this.cur().val || '').trim()) {
            return this.parseChunk()
          }
        default:
          throw this.error(
            'unexpected token in extend mode on line ' + this.cur().lineno,
            this.cur().pos
          )
      }
    }

    // 正在被 include
    if (this.included) {
      switch (this.cur().type) {
        case 'extend':
        case 'block':
        case 'blockDefine':
          throw this.error(
            `token ${this.cur().type} are not allowed in included files`,
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
        throw this.error('unexpected token on line ' + this.cur().lineno, this.cur().pos)
    }
  }

  parseExtend() {
    this.expect('extend')
    const tok = this.cur()
    this.consume(1)
    return cloneDeep(tok)
  }

  parseBlock() {
    // start
    const start = this.cur()
    const mode = start.extraData?.mode
    this.consume(1)

    // chunk
    const chunk = this.parseChunk()

    // end
    const end = this.expect('closeSection', mode)
    this.consume(1)

    return { ...start, nodes: [chunk] }
  }

  parseBlockDefine() {
    const tok = this.cur()
    this.consume(1)
    return {
      type: 'block' as const,
      val: tok.val,
      mode: 'block',
      nodes: [],
    }
  }

  parseChunk() {
    const chunk = {
      type: 'chunk' as const,
      // TODO: figure out typeof chunk.nodes
      nodes: [] as any[],
      val: undefined,
    }

    let tok: Token, node
    out: while (this.tokens.length) {
      switch (this.cur().type) {
        case 'comment':
        case 'htmlComment':
        case 'text':
        case 'interpolation':
        case 'code':
          tok = this.cur()
          this.consume(1)
          chunk.nodes.push(cloneDeep(tok))
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

    const node = cloneDeep(tok)
    return node
  }

  parseEach() {
    this.expect('each')
    const start = this.cur()
    this.consume(1)

    const chunk = this.parseChunk()

    const end = this.expect('closeSection', 'each')
    this.consume(1)

    // const each = cloneDeep(start)
    // each.nodes = [chunk]
    // return each
    return { ...start, nodes: [chunk] }
  }

  parseIf() {
    const ret = {
      type: 'if' as const,
      nodes: [] as any[],
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

      const elseifChunk = this.parseChunk()
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

      const elseChunk = this.parseChunk()
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
