'use strict'

module.exports = class Node {
  constructor(val) {
    this.type = 'Node'
    this.val = val
    this.nodes = []
  }

  toString() {
    return `<${ this.type } ${ this.val }>`
  }
}