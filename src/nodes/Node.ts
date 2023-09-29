/* eslint-disable @typescript-eslint/no-explicit-any */

export class Node {
  type: string
  val: string
  nodes: any[]

  constructor(val: string) {
    this.type = 'Node'
    this.val = val
    this.nodes = []
  }

  toString() {
    return `<${this.type} ${this.val}>`
  }
}
