/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseDebug } from './common'
import { RactSyntaxError } from './ractSyntaxError'

const debug = baseDebug.extend('lexer')

export type TokenType =
  | 'htmlComment'
  | 'comment'
  | 'extend'
  | 'include'
  | 'block'
  | 'blockDefine'
  | 'if'
  | 'elseif'
  | 'else'
  | 'interpolation'
  | 'code'
  | 'closeSection'
  | 'each'
  | 'text'
  | 'eos'

export type Token = {
  type: TokenType
  val: any
  lineno: number
  pos: number
  extraData?: Record<string, any>
}

class JadeStyleLexer {
  originalInput: string
  input: string
  filename: string
  lineno = 1
  cursor = 0

  constructor(input: string, filename: string) {
    this.originalInput = input.replace(/\r\n|\r/g, '\n')
    this.input = this.originalInput
    this.filename = filename
  }

  consume(len: number) {
    this.input = this.input.slice(len)
    this.cursor += len
    return this
  }

  tok(type: TokenType, val?: any): Token {
    return {
      type,
      val,
      lineno: this.lineno,
      pos: this.cursor,
    }
  }

  scan(reg: RegExp, type: TokenType, assert?: (val: string) => void) {
    const captures = reg.exec(this.input)
    debug('captures = %j', captures)
    if (captures) {
      const val = captures[1]
      assert && assert(val)

      // tok(pos) > consume
      const tok = this.tok(type, val)
      this.consume(captures[0].length)
      return tok
    }
  }

  eos() {
    if (this.input.length) return
    return this.tok('eos')
  }

  tokens: Token[] = []
  lex() {
    this.tokens = []
    let cur: Token
    while (((cur = this.next()), cur.type !== 'eos')) {
      // console.log(cur)
      this.tokens.push(cur)
    }
    return this.tokens
  }

  next(): Token {
    throw new Error('not implemented')
  }

  error(message: string, pos?: number) {
    return new RactSyntaxError(message, {
      input: this.originalInput,
      filename: this.filename,
      pos: pos || this.cursor,
    })
  }

  assertExpression = (expr: string) => {
    try {
      Function('', `return (${expr})`)
    } catch (e) {
      throw this.error('bad expression')
    }
  }
  assertCode = (code: string) => {
    try {
      Function('', code)
    } catch (e) {
      throw this.error('bad js code')
    }
  }
}

export class Lexer extends JadeStyleLexer {
  constructor(str: string, filename: string) {
    super(str, filename)
  }

  next() {
    return (
      this.eos() ||
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
      this.fail()
    )
  }

  fail(): Token {
    /* istanbul ignore next */
    const msg = `unexpected token on line ${this.lineno}`
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
    const reg = /^{{ *?(extend|block|include) *?([\w-.]+?) *?}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    const type = captures[1] as TokenType
    const val = captures[2]
    const tok = this.tok(type, val)
    this.consume(captures[0].length)
    if (type === 'block') tok.type = 'blockDefine'
    return tok
  }

  elseDirective() {
    const reg = /^{{ *?else *?}}/
    return this.scan(reg, 'else')
  }

  elseIfDirective() {
    const reg = /^{{ *?else *?if *?([^\n]+?)}}/
    return this.scan(reg, 'elseif', this.assertExpression)
  }

  interpolation() {
    const reg = /^{{(!?) *?([^\n]+?) *?}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    const tok = this.tok('interpolation', captures[2])
    this.assertExpression(tok.val)
    this.consume(captures[0].length)
    const isRaw = captures[1] === '!'
    tok.extraData = { isRaw }
    return tok
  }

  code() {
    const reg = /^{{-\s*?([\s\S]+?)\s*?}}/
    return this.scan(reg, 'code', this.assertCode)
  }

  closeSection() {
    const reg = /^{{ *\/ *?(\w+?) *}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    const tok = this.tok('closeSection', captures[1])

    // invalid closeSection
    // error
    if (['if', 'each', 'block', 'append', 'prepend'].indexOf(tok.val) === -1) {
      throw this.error('invalid closeSection')
    }

    this.consume(captures[0].length)
    return tok
  }

  section() {
    return this.ifSection() || this.each() || this.block()
  }

  ifSection() {
    const reg = /^{{ *# *if *([^\n]+?) *}}/
    return this.scan(reg, 'if', this.assertExpression)
  }

  each() {
    const reg = /^{{ *# *each *([a-zA-Z_$]\w*?) *(?:,([a-zA-Z_$]\w*?))? *in *([^\n]+?) *}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    // extract
    let index = captures[1]
    let item = captures[2]
    if (!item) {
      item = index
      index = ''
    }
    const array = captures[3]

    // check identifier
    if (index) this.assertExpression(index)
    this.assertExpression(item)
    this.assertExpression(array)

    const tok = this.tok('each', {
      index,
      item,
      array,
    })
    this.consume(captures[0].length)

    return tok
  }

  block() {
    const reg = /^{{ *# *(block|prepend|append) *([\w-_$@]+?) *}}/
    const captures = reg.exec(this.input)
    if (!captures) return

    const mode = captures[1]
    const name = captures[2]
    const tok = this.tok('block', name)
    this.consume(captures[0].length)
    tok.extraData = { mode }
    return tok
  }

  text() {
    const reg = /^([\s\S]+?)(?={{|$|<!--)/
    const tok = this.scan(reg, 'text')

    /* istanbul ignore if */
    if (!tok) return

    const lines = tok.val.split(/\n/).length - 1
    this.lineno += lines
    return tok
  }
}
