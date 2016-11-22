'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const _trim = require('lodash/trim')
const _cloneDeep = require('lodash/cloneDeep')
const Parser = require('./parser.js')
const LocalUtil = require('./util.js')

Parser.parse = function(filename, included) {
  const content = fs.readFileSync(filename, 'utf8')
  const f = new Parser(content, filename, included).parse()
  new PostParser(f)
  return f
}

/**
 * 处理
 */

const PostParser = module.exports = class PostParser {
  constructor(f) {
    this.file = f
    this.filename = f.val
    this.extending = f.extending
    this.blocks = f.blocks

    this.checkExtend(f)
    this.walk(f)
    this.handleExtend(f)
  }

  checkExtend(file) {
    if (!this.extending) return

    for (let n of file.nodes) {
      if (n.type === 'chunk' && n.nodes) {
        for (let node of n.nodes) {
          if (['comment', 'htmlComment', 'text'].indexOf(node.type) === -1) {
            throw file.lexer.error(`token ${ node.type } not allowed`, node.pos)
          }

          // 只允许空白 text
          if (node.type === 'text' && _trim(node.val)) {
            throw file.lexer.error('text not allowed in extending template', node.pos)
          }
        }
      }
    }
  }

  walk(node) {
    if (node.nodes) {
      for (let n of node.nodes) {
        this.walk(n)
      }
    }

    if (node.type === 'include') {
      this.handleInclude(node)
    }
  }

  resolve(target) {
    target = LocalUtil.getName(target)
    if (!path.extname(target)) {
      target += path.extname(this.filename)
    }
    const targetFilename = path.resolve(path.dirname(this.filename), target)
    return targetFilename
  }

  handleInclude(node) {
    const targetFilename = this.resolve(node.val)
    const f = Parser.parse(targetFilename, true)
    assert(f.nodes.length <= 1)
    node.nodes = f.nodes
  }

  handleExtend() {
    if (!this.extending) {
      return
    }

    const targetFilename = this.resolve(this.extending)
    const f = Parser.parse(targetFilename)
    const keys = Object.keys(this.blocks)
    for (let name of keys) {
      const cur = this.blocks[name]
      const parent = f.blocks[name]
      if (!parent) {
        throw this.file.lexer.error('no block definition found in layout', cur.pos)
      }

      switch (cur.mode) {
        case 'prepend':
          parent.nodes = (cur.nodes || []).concat(parent.nodes)
          break
        case 'append':
          parent.nodes = (parent.nodes || []).concat(cur.nodes)
          break
        default:
          parent.nodes = cur.nodes
          break
      }
    }

    // replace
    this.file.nodes = f.nodes
  }
}