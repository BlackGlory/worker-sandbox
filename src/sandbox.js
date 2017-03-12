'use strict'

import _ from 'lodash'
import Runtime from './runtime'
export { TimeoutError, PermissionError } from './runtime'

export class Sandbox extends Runtime {
  constructor(...args) {
    super(...args)
    this.history = []
  }

  async save() {
    this.history.push(_.cloneDeep(this.context))
  }

  async restore() {
    // TODO
    this.context = this.history.pop()
  }

  async clone() {
    let sandbox = new Sandbox(this.context)
    sandbox.history = _.cloneDeep(this.history)
  }

  async clear() {
    // TODO
    this.context = this.history[0]
    this.history = [this.context]
  }
}

export default Sandbox
