'use strict'

const _repeat = require('lodash/repeat')
const _padStart = require('lodash/padStart')
const stringWidth = require('string-width')

module.exports = class RactSyntaxError extends Error {
  constructor(message, options) {
    super(message)
    Error.captureStackTrace(this)

    options = options || {}
    this.filename = options.filename || 'unknown'
    this.input = options.input
    this.pos = options.pos

    const tuple = this._pos()
    this.lineno = tuple[0]
    this.colno = tuple[1]

    const arr = [
      `File ${ this.filename }, line ${ this.lineno } column ${ this.colno }`,
    ]
    for (let i = this.lineno; i <= Math.min(this.lineno + 2, this.lines.length); i++) {
      const content = this.lines[i - 1].replace(/\t/, '    ') // 4 space
      arr.push(`${ _padStart(i.toString(), 4, ' ') }|${ content }`)

      // indicator
      if (i === this.lineno) {
        const indent = _repeat(' ', stringWidth(content.slice(0, this.colno - 1)))
        arr.push(`${ _repeat(' ', 4) }|${ indent }^`)
      }
    }


    this.stack = arr.join('\n') + '\n\n' + this.stack
  }

  _pos() {
    this.lines = this.input.split(/\n/)
    const lens = this.lines.map(l => l.length + 1)

    let lineno = 1
    let colno = this.pos + 1 // pos 0 based

    while (colno > lens[lineno - 1]) {
      colno -= lens[lineno - 1]
      lineno++
    }

    return [lineno, colno]
  }
}