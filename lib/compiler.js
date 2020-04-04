const Parser = require('./parser.js')
const _startsWith = require('lodash/startsWith')
const _trim = require('lodash/trim')

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

    const body = this.codes.join('\n')
    return Function('locals', body)
  }

  output(code) {
    this.codes.push(code)
  }

  buf(b) {
    this.output(`__result__ += ${JSON.stringify(b)};`)
  }

  addRuntime() {
    this.output(`
      function __sanitize__ (s) {
        return s && s.toString() && s.toString()
          .replace('&', '&amp;')
          .replace(/ /g, '&nbsp;')
          .replace(/</g, '&lt;')
          .replace(/>/g,'&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
          .replace(/￠/g, '&cent;')
          .replace(/£/g, '&pound;')
          .replace(/¥/g, '&yen;')
          .replace(/€/g,'&euro;')
          .replace(/§/g,'&sect;')
          .replace(/©/g,'&copy;')
          .replace(/®/g,'&reg;')
          .replace(/™/g,'&trade;')
          .replace(/×/g,'&times;')
          .replace(/÷/g,'&divide;')
      };

      var __result__ = '';
    `)
  }

  /**
   * try/catch 做什么
   */

  wrap(body) {
    return `(function(){ ${body} })()`
  }

  /**
   * try/catch get 一个值
   */

  tryGet(val, defaults) {
    let code = `
      try{
        return ${val} || ${defaults};
      } catch(e) {/* noop */}
    `

    if (val && /^[a-zA-Z_$]/g.test(val)) {
      code += `
        try{
          return locals.${val} || ${defaults};
        } catch(e) {/* noop */}
      `
    }

    // defaults
    code += `
      return ${defaults};
    `

    return this.wrap(code)
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
    this.output(`/* ${n.val} */`)
  }

  htmlComment(n) {
    this.buf('<!--' + n.val + '-->')
  }

  text(n) {
    this.buf(n.val)
  }

  interpolation(n) {
    const val = this.tryGet(n.val, '""')
    if (n.raw) {
      this.output(`__result__ += ${val};`)
    } else {
      this.output(`__result__ += __sanitize__(${val});`)
    }
  }

  /**
   * code block should not be wrapped in a function block
   */

  code(n) {
    this.output(`
      try{
        ${n.val}
      } catch(e) {/*noop*/}
    `)
  }

  ifNode(i) {
    for (let n of i.nodes) {
      let val = 'false'
      if (n.val) {
        val = this.tryGet(n.val, 'false')
      }

      if (n.type === 'if') {
        this.output('if (' + val + ') {')
      } else if (n.type === 'elseif') {
        this.output('else if (' + val + ') {')
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
    let array = n.val.array
    array = this.tryGet(array, '[]')

    this.output(`for(var ${index} = 0; ${index} < (${array}).length; ${index}++){`)
    this.output(`var ${item} = (${array})[${index}];`)
    this.dispatch(n.nodes[0])
    this.output('}')
  }
}
