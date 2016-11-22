'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const _trim = require('lodash/trim')
const Parser = require('./parser.js')

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
    this.filename = f.val
    this.walk(f)
    this.handleExtend()
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

  handleInclude(node) {
    let target = _trim(node.val, ' "\'')
    if (!path.extname(target)) {
      target += path.extname(this.filename)
    }
    const targetFilename = path.resolve(path.dirname(this.filename), target)
    const f = Parser.parse(targetFilename, true)
    assert(f.nodes.length <= 1)
    node.nodes = f.nodes
  }

  handleExtend() {

  }
}