'use strict'

const Parser = require('./parser.js')

module.exports = class Compiler {
  constructor(file) {
    this.file = file
  }

  cur() {
    return this.file.tokens[0]
  }

  consume(n) {
    this.file.nodes = this.file.nodes.slice(n)
  }

  compile() {
    while (this.file.nodes.legth) {
      this.dispatch(this.cur())
    }
  }

  dispatch(node) {
    switch (this.cur().type) {
      case 'chunk':
      case 'comment':
      case 'htmlComment':
      case 'interpolation':
      case 'code':
        return this[this.cur().type](this.cur())
      default:
        break
    }
  }

  extend(c) {
    for (let n of c.nodes) {
      this.dispatch(n)
    }

  }

  chunk() {

  }

  ifNode(i) {
    for (let n of i.nodes) {
      if (n.type === 'if') {
        this.buf('if (' + n.val + ') {\n')
        this.dispatch(n.chunk)
        this.buf('}')
      } else if (n.type === 'elseif') {
        this.buf('else if (' + n.val + ') {\n')
        this.dispatch(n.chunk)
        this.buf('}')
      } else if (n.type === 'else') {
        this.buf('else {\n')
        this.dispatch(n.chunk)
        this.buf('}')
      }
    }
  }

  each() {

  }
}