'use strict'

const Parser = require('../lib/parser.js')

describe('Parser', function() {
  it('#parse', function() {
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

      {{block name}}

      {{#block name1}}
      {{/block}}
      {{#prepend name2}}
      {{/prepend}}
      {{#append name3}}
      {{/append}}
    </html>
    `
    const filename = 'fake.filename'
    const parser = new Parser(input, filename, false)
    const f = parser.parse()
    f.should.be.ok()
  })
})