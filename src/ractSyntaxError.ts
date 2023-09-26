/* eslint-disable @typescript-eslint/no-explicit-any */

import { padStart, repeat } from 'lodash-es'
import stringWidth from 'string-width'

export class RactSyntaxError extends Error {
  input: string
  filename: string
  pos: number

  lines: string[]
  lineno: number
  colno: number

  constructor(message: string, options: { input: string; filename: string; pos: number }) {
    super(message)
    Error.captureStackTrace(this)

    this.input = options.input
    this.filename = options.filename || 'unknown'
    this.pos = options.pos

    const tuple = this._pos()
    this.lineno = tuple[0]
    this.colno = tuple[1]

    const arr = [`File ${this.filename}, line ${this.lineno} column ${this.colno}`]
    for (let i = this.lineno; i <= Math.min(this.lineno + 2, this.lines.length); i++) {
      const content = this.lines[i - 1].replace(/\t/, '    ') // 4 space
      arr.push(`${padStart(i.toString(), 4, ' ')}|${content}`)

      // indicator
      if (i === this.lineno) {
        const indent = repeat(' ', stringWidth(content.slice(0, this.colno - 1)))
        arr.push(`${repeat(' ', 4)}|${indent}^`)
      }
    }

    this.stack = arr.join('\n') + '\n\n' + this.stack
  }

  _pos() {
    this.lines = this.input.split(/\n/)
    const lens = this.lines.map((l) => l.length + 1)

    let lineno = 1
    let colno = this.pos + 1 // pos 0 based

    while (colno > lens[lineno - 1]) {
      colno -= lens[lineno - 1]
      lineno++
    }

    return [lineno, colno]
  }
}

/**
 * 给其他类使用
 * SomeClass#error
 */

export function ractError(message: string, pos: number) {
  return new RactSyntaxError(message, {
    input: this.input,
    filename: this.filename,
    pos,
  })
}
