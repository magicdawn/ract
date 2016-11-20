module.exports = class File {
  constructor(node) {
    this.nodes = []
    if (node) this.nodes.push(node)
  }

  push(node) {
    this.nodes.push(node)
    return this
  }
}