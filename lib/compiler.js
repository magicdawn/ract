'use strict'

const Parser = require('./parser.js')

module.exports = class Compiler {
  constructor(file) {
    this.file = file
  }

  compile() {
    this.codes = []
    this.addRuntime()

    for (let cur of this.file.nodes) {
      this.dispatch(cur)
    }

    this.output('return __result__;')
    return this.codes.join('\n')
  }

  output(code) {
    this.codes.push(code)
  }

  buf(b) {
    this.output(`__result__ += ${ JSON.stringify(b) }`)
  }

  addRuntime() {
    this.output(`
      function __sanitize__ (s) {
        return s
      };

      var __result__ = '';
    `)
  }

  dispatch(node) {
    if (node.type === 'if') {
      return this.ifNode(node)
    }

    // 'block'
    // 'chunk'
    // 'include'
    if (['block', 'chunk', 'include'].indexOf(node.type) > -1) {
      for (let c of node.nodes) {
        this.dispatch(c)
      }
      return
    }

    // 'comment'
    // 'htmlComment'
    // 'interpolation'
    // 'code'
    // 'each'
    return this[node.type](node)
  }

  comment(n) {
    this.output(`/* ${ n.val } */`)
  }

  htmlComment(n) {
    this.buf('<!--' + n.val + '-->')
  }

  text(n) {
    this.buf(n.val)
  }

  interpolation(n) {
    if (n.isRaw) {
      this.output(`__result__ += ${ n.val }`)
    } else {
      this.output(`__result__ += __sanitize__(${ n.val })`)
    }
  }

  code(n) {
    this.output(n.val)
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

      // single chunk
      for (let c of n.nodes) {
        this.dispatch(c)
      }

      this.output('}')
    }
  }

  each(n) {
    const index = n.val.index || '__index__'
    const item = n.val.item
    const array = n.val.array

    this.output(`for(var ${index} = 0;${index} < (${array}).length;${index}++ ){`)
    this.output(`var ${item} = (${array})[${index}]`)
    this.dispatch(n.nodes[0])
    this.output('}')
  }
}