/* eslint semi: off, no-constant-condition: off, no-cond-assign: off */

const debug = require('debug')('ractive:lexer')
const _ = require('lodash')

class RactSyntaxError extends Error {
  constructor(message, options) {
    super(message)
    Error.captureStackTrace(this)

    options = options || {}
    this.filename = options.filename || 'unknown'
    this.lineno = options.lineno
    this.colno = options.colno
    this.lines = options.lines

    const indent = _.repeat(' ', this.colno - 1)

    const arr = [
      `File ${ this.filename }, line ${ this.lineno } column ${ this.colno }`,
      `    ${this.lineno     }|${this.lines[this.lineno - 1]}`,
      `      |${ indent }^`,
      `    ${this.lineno + 1 }|${this.lines[this.lineno]}`,
      `    ${this.lineno + 2 }|${this.lines[this.lineno + 1]}`,
    ]

    this.stack = arr.join('\n') + '\n\n' + this.stack
  }
}

class JadeStyleLexer {
  constructor(str) {
    this.originalInput = str.replace(/\r\n|\r/g, '\n')
    this.input = this.originalInput
    this.lineno = 1
    this.cursor = 0
    this.assertExpression = this.assertExpression.bind(this)
    this.assertCode = this.assertCode.bind(this)
  }

  consume(len) {
    this.input = this.input.substr(len)
    this.cursor += len
    return this
  }

  getColno(pos) {
    pos = pos || this.cursor
    const lines = this.originalInput.split(/\n/)
    const lastend = lines.slice(0, this.lineno - 1).reduce((sum, line) => sum + line.length + 1, 0)
    return pos - lastend + 1
  }

  tok(type, val) {
    return {
      type,
      val,
      lineno: this.lineno,
    }
  }

  scan(reg, type, assert) {
    const captures = reg.exec(this.input)
    debug('captures = %j', captures)
    if (captures) {
      const val = captures[1]
      assert && assert(val)

      this.consume(captures[0].length)
      return this.tok(type, val)
    }
  }

  eos() {
    if (this.input.length) return
    return this.tok('eos')
  }

  lex() {
    this.tokens = []
    let cur
    while (cur = this.next(), cur.type !== 'eos') {
      console.log(cur)
      this.tokens.push(cur)
    }
    return this.tokens
  }

  error(message) {
    throw new RactSyntaxError(message, {
      lineno: this.lineno,
      colno: this.getColno(),
      lines: this.originalInput.split(/\n/),
    })
  }

  assertExpression(expr) {
    try {
      Function('', `return (${ expr })`)
    } catch (e) {
      this.error('bad expression')
    }
  }

  assertCode(code) {
    try {
      Function('', code)
    } catch (e) {
      this.error('bad js code')
    }
  }
}

const Lexer = module.exports = class Lexer extends JadeStyleLexer {
  constructor(str) {
    super(str)
  }

  next() {
    return (
      // this.blank() ||
      this.htmlComment() || // <!-- xxx -->
      this.directive() || // 指令
      this.elseDirective() || // {{else}}
      this.elseIfDirective() || // {{else if xxx}}
      this.code() || // 代码块 {{- var x = 1 }}
      this.section() || // section
      this.closeSection() || // {{#/if}}
      this.comment() || // {{# comment #}}
      this.interpolation() || // 插值 {{ var }} & {{! var }}
      this.text() ||
      this.eos() ||
      this.fail()
    )
  }

  fail() {
    const msg = `unexpected token on line ${ this.lineno }`
    throw new Error(msg)
  }

  htmlComment() {
    if (/^<!--/.test(this.input)) {
      const idx = this.input.indexOf('-->')
      const tok = this.tok('htmlComment', this.input.substring(4, idx))
      this.consume(idx + 3)
      return tok
    }
  }

  comment() {
    const reg = /^{{#([\s\S]*?)#}}/
    return this.scan(reg, 'comment')
  }

  directive() {
    const reg = /^{{ *?(extend|block|include) *?([\w-.]+) *?}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    this.consume(captures[0].length)
    const type = captures[1]
    const val = captures[2]
    const tok = this.tok(type, val)
    if (type === 'block') tok.type = 'blockDefine'
    return tok
  }

  elseDirective() {
    const reg = /^{{ *?else *?}}/
    return this.scan(reg, 'else')
  }

  elseIfDirective() {
    const reg = /^{{ *?else *?if *?([^\n]+)}}/
    return this.scan(reg, 'elseif', this.assertExpression)
  }

  interpolation() {
    const reg = /^{{(!?) *([^\n]+) *}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    const tok = this.tok('interpolation', captures[2])
    this.assertExpression(tok.val)
    this.consume(captures[0].length)
    const isRaw = captures[1] === '!'
    tok.raw = isRaw
    return tok
  }

  code() {
    const reg = /^{{-\s*?([\s\S]+?)\s*?}}/
    return this.scan(reg, 'code', this.assertCode)
  }

  closeSection() {
    const reg = /^{{ *\/ *?(\w+) *}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    const tok = this.tok('closeSection', captures[1])

    // invalid closeSection
    if (['if', 'each', 'block', 'append', 'prepend'].indexOf(tok.val) === -1) {
      // error
      this.error('invalid closeSection')
    }

    this.consume(captures[0].length)
    return tok
  }

  section() {
    return (
      this.ifSection() ||
      this.each() ||
      this.block()
    )
  }

  ifSection() {
    const reg = /^{{ *# *if *([^\n]+) *}}/
    return this.scan(reg, 'if', this.assertExpression)
  }

  each() {
    const reg = /^{{ *# *each *([a-zA-Z_$]\w*) *((?:,[a-zA-Z_$]\w*)?) *in *([^\n]+?) *}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    this.consume(captures[0].length)
    let $index = captures[1]
    let $value = captures[2]
    if (!$value) {
      $value = $index
      $index = ''
    }

    const $array = captures[3]
    const tok = this.tok('each', {
      index: $index,
      value: $value,
      array: $array,
    })
    return tok
  }

  block() {
    const reg = /^{{ *# *(block|prepend|append) *([\w-_$@]+) *}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    this.consume(captures[0].length)
    const mode = captures[1]
    const name = captures[2]
    const tok = this.tok('block', name)
    tok.mode = mode
    return tok
  }

  text() {
    let reg = /^([\s\S]+?)(?={{|$|<!--)/
    const tok = this.scan(reg, 'text')
    if (!tok) return

    const lines = tok.val.split(/\n/).length - 1
    this.lineno += lines
    return tok
  }
}