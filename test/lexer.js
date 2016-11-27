'use strict'

const Lexer = require('../lib/lexer.js')
const RactSyntaxError = require('../lib/ractSyntaxError.js')

describe('Lexer', function() {
  it('#lex', function() {
    const input = `
    <html>
      <!--html comment-->
      {{# ract comment #}}

      {{ interpolation }}
      {{! rawInterpolation }}
      {{- var message = 'hello ract'}}

      {{#if true}}
        hello
      {{else if false}}
        elseif
      {{else}}
        else
      {{/if}}
      {{#each item in array}}
        {{item}}
      {{/each}}
      {{#each index,item in array}}
        {{index}} - {{item}}
      {{/each}}

      {{include hello}}
      {{extend foo}}
      {{block name}}

      {{#block name}}
      {{/block}}
      {{#prepend name}}
      {{/prepend}}
      {{#append name}}
      {{/prepend}}
    </html>
    `
    const filename = 'fake.filename'
    const lexer = new Lexer(input, filename)
    const tokens = lexer.lex()
    tokens.should.be.ok()
  })

  it('invalid closeSection', () => {
    const input = '{{/foo}}'
    const filename = 'fake.filename'
    try {
      const tokens = new Lexer(input, filename).lex()
    } catch (e) {
      // throw e
      e.should.instanceOf(RactSyntaxError)
      e.message.should.equal('invalid closeSection')
    }
  })

  it('bad expression', () => {
    const input = '{{#if @}}{{/if}}'
    const filename = 'fake.filename'
    try {
      const tokens = new Lexer(input, filename).lex()
    } catch (e) {
      e.should.instanceOf(RactSyntaxError)
      e.message.should.equal('bad expression')
    }
  })

  it('bad js code', () => {
    const input = '{{- hello world}}'
    const filename = 'fake.filename'
    try {
      const tokens = new Lexer(input, filename).lex()
    } catch (e) {
      e.should.instanceOf(RactSyntaxError)
      e.message.should.equal('bad js code')
    }
  })
})