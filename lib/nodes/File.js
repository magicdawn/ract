'use strict'

const Node = require('./Node.js')

module.exports = class File extends Node {
  constructor(filename) {
    super(filename)
    this.type = 'File'
  }

  compile() {

  }
}