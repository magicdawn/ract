/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert'
import { trim } from 'lodash-es'
import path from 'path'
import { parse } from './index'
import { FileNode } from './nodes'
import { ractError } from './ractSyntaxError'
import { getName } from './util'

/**
 * 处理
 */

export class PostParser {
  input: string
  filename: string
  fileNode: FileNode

  constructor(input: string, filename: string, fileNode: FileNode) {
    this.input = input
    this.filename = filename
    this.fileNode = fileNode // File node

    this.checkExtend(fileNode)
    this.walk(fileNode)
    this.handleExtend()
  }

  checkExtend(file) {
    if (!this.fileNode.extending) return

    for (const n of file.nodes) {
      if (n.type === 'chunk' && n.nodes) {
        for (const node of n.nodes) {
          if (['comment', 'htmlComment', 'text'].indexOf(node.type) === -1) {
            throw this.error(`token ${node.type} not allowed`, node.pos)
          }

          // 只允许空白 text
          if (node.type === 'text' && trim(node.val)) {
            throw this.error('text not allowed in extending template', node.pos)
          }
        }
      }
    }
  }

  error(arg0: string, pos: any) {
    throw new Error('Method not implemented.')
  }

  walk(node: FileNode) {
    if (node.nodes) {
      for (const n of node.nodes) {
        this.walk(n)
      }
    }

    if (node.type === 'include') {
      this.handleInclude(node)
    }
  }

  resolve(target: string) {
    target = getName(target)
    if (!path.extname(target)) {
      target += path.extname(this.filename)
    }
    const targetFilename = path.resolve(path.dirname(this.filename), target)
    return targetFilename
  }

  handleInclude(node) {
    const targetFilename = this.resolve(node.val)
    const f = parse(targetFilename, true)
    assert(f.nodes.length <= 1)
    node.nodes = f.nodes
  }

  handleExtend() {
    if (!this.fileNode.extending) {
      return
    }

    const targetFilename = this.resolve(this.fileNode.extending)
    const f = parse(targetFilename)
    const keys = Object.keys(this.fileNode.blocks)
    for (const name of keys) {
      const cur = this.fileNode.blocks[name]
      const parent = f.blocks[name]
      if (!parent) {
        throw this.error('no block definition found in layout', cur.pos)
      }

      switch (cur.mode) {
        case 'prepend':
          parent.nodes = (cur.nodes || []).concat(parent.nodes)
          break
        case 'append':
          parent.nodes = (parent.nodes || []).concat(cur.nodes)
          break
        default:
          parent.nodes = cur.nodes
          break
      }
    }

    // replace
    this.fileNode.nodes = f.nodes
  }
}

/**
 * add this.error
 */

PostParser.prototype.error = ractError
