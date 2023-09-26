import { Node } from './Node'

export class FileNode extends Node {
  extending = false

  blocks: Record<string, string>

  constructor(filename: string) {
    super(filename)
    this.type = 'File'
  }

  compile() {
    //
  }
}
