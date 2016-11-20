'use strict'

const _repeat = require('lodash/repeat')

module.exports = class RactSyntaxError extends Error {
  constructor(message, options) {
    super(message)
    Error.captureStackTrace(this)

    options = options || {}
    this.filename = options.filename || 'unknown'
    this.lineno = options.lineno
    this.colno = options.colno
    this.lines = options.lines

    const indent = _repeat(' ', this.colno - 1)

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