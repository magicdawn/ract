const Lexer = require('../lib/lexer.js')

describe('Lexer', function() {

  it('lex', async function() {
    const input = `
    <html>
      <!--html comment-->
      {{# ract comment #}}

      {{ interpolation }}
      {{! rawInterpolation }}
      {{- var message = 'hello ract'}}

      {{#if true}}
        hello
      {{/if}}
      {{#each item in array}}
        {{item}}
      {{/each}}
      {{#each index,item in array}}
        {{index}} - {{item}}
      {{/each}}
    </html>
    `
    const filename = 'fake.filename'

    const lexer = new Lexer(input, filename)
    const tokens = lexer.lex()
    tokens.should.be.ok()
  })
})