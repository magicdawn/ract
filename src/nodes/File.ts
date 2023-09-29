/* eslint-disable @typescript-eslint/no-explicit-any */

import { Node } from './Node'

export class FileNode extends Node {
  extending: string | undefined

  blocks: Record<string, any>

  constructor(filename: string) {
    super(filename)
    this.type = 'File'
  }

  compile() {
    //
  }
}
