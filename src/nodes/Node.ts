export class Node {
  type: string
  val: string
  nodes: string[]

  constructor(val: string) {
    this.type = 'Node'
    this.val = val
    this.nodes = []
  }

  toString() {
    return `<${this.type} ${this.val}>`
  }
}
