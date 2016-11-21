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
    this.codes = []
    for (let cur of this.file.nodes) {
      this.dispatch(cur)
    }
  }

  output(code) {
    this.codes.push(code)
  }

  buf(b) {
    this.output(`__result += ${ JSON.stringify(b) }`)
  }

  dispatch(node) {
    if (node.type === 'if') {
      return this.ifNode(node)
    }

    // 'extend'
    // 'block'
    // 'chunk'
    // 'comment'
    // 'htmlComment'
    // 'interpolation'
    // 'code'
    // 'include'
    // 'blockDefine'
    // 'each'
    return this[node.type](node)
  }

  extend(c) {
    // for (let n of c.nodes) {
    //   this.dispatch(n)
    // }
  }

  block(b) {

  }

  chunk(c) {
    for (let n of c.nodes) {
      this.dispatch(n)
    }
  }

  comment(n) {
    this.buf(`/* ${ n.val } */`)
  }

  htmlComment(n) {
    this.buf('<!--' + n.val + '-->')
  }

  interpolation(n) {
    if (n.isRaw) {
      this.output(`__result += ${ n.val }`)
    } else {
      this.output(`__result += sanitize(${ n.val })`)
    }
  }

  ifNode(i) {
    for (let n of i.nodes) {
      if (n.type === 'if') {
        this.output('if (' + n.val + ') {')
      } else if (n.type === 'elseif') {
        this.output('else if (' + n.val + ') {')
      } else if (n.type === 'else') {
        this.output('else {')
      }
      this.dispatch(n.chunk)
      this.output('}')
    }
  }

  each() {

  }
}