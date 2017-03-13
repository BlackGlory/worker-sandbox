'use strict'

import _ from 'lodash'
import Runtime from './runtime'
export { TimeoutError, PermissionError } from './runtime'

export class Sandbox extends Runtime {
  constructor(...args) {
    super(...args)
    this._history = []
  }

  async save() {
    this._history.push(_.cloneDeep(this._context))
  }

  async restore() {
    this.context = this._history.pop()
  }

  async clone() {
    let sandbox = new Sandbox(this._context)
    sandbox._history = _.cloneDeep(this._history)
    return sandbox
  }
}

export default Sandbox
