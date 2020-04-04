const Parser = require('../lib/parser.js')
const PostParser = require('../lib/postparser.js')
const RactSyntaxError = require('../lib/ractSyntaxError.js')

describe('Parser', function () {
  const filename = 'fake.filename'

  it('#parse', function () {
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
    const parser = new Parser(input, filename, false)
    const f = parser.parse()
    f.should.be.ok()
  })

  it('#expect type', function () {
    const input = '{{#block foo}}hello'
    const parser = new Parser(input, filename, false)

    try {
      const f = parser.parse()
    } catch (e) {
      e.should.instanceOf(RactSyntaxError)
      e.message.should.match(/unexpected token/)
    }
  })

  it('#expect val', function () {
    const input = '{{#block foo}}{{/append}}'
    const parser = new Parser(input, filename, false)

    try {
      const f = parser.parse()
    } catch (e) {
      e.should.instanceOf(RactSyntaxError)
      e.message.should.match(/unexpected token closeSection value/)
    }
  })

  it('#parse duplicate block definition', function () {
    const input = '{{block foo}}{{#block foo}}{{/block}}'
    const parser = new Parser(input, filename, false)

    try {
      const f = parser.parse()
    } catch (e) {
      e.should.instanceOf(RactSyntaxError)
      e.message.should.match(/duplicate block definition foo/)
    }
  })

  it('#parse extend', function () {
    const dirname = __dirname + '/fixtures/parser/'
    Parser.parse(dirname + 'extend.html')
  })

  it('#parse extend no match block', function () {
    const dirname = __dirname + '/fixtures/parser/'
    try {
      Parser.parse(dirname + 'extend_no_match.html')
    } catch (e) {
      e.should.instanceOf(RactSyntaxError)
      e.message.should.match(/no block definition found/)
    }
  })

  it('#parse extend only once', function () {
    const input = '{{extend 1}}{{extend 2}}'
    const parser = new Parser(input, filename)
    try {
      parser.parse()
    } catch (e) {
      e.should.instanceOf(RactSyntaxError)
      e.message.should.match(/extend once/)
    }
  })
})
