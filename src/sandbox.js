'use strict'

import _ from 'lodash'
import Runtime from './runtime'

export class TimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TimeoutError'
  }
}

function timeoutReject(timeout, message = 'timeout') {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      reject(new TimeoutError(message))
    }, timeout)
  })
}

export class Sandbox extends Runtime {
  constructor(context = {}) {
    super(context)
  }

  get worker() {
    return this._worker
  }

  get status() {
    // TODO
    return
  }

  async set(name, value) {
    return await this.sendAssignMessage(name, value)
  }

  async assign(obj) {
    return await Promise.all(
      Object.keys(obj).map(name => this.sendAssignMessage(name, obj[name]))
    )
  }

  async get(name) {
    let value = await this.sendAccessMessage(name)
    return value
  }

  async call(name, ...args) {
    return await this.sendCallMessage(name, ...args)
  }

  async eval(code, timeout) {
    if (_.isFunction(code)) {
      code = `(${ code })()`
    }
    if (timeout) {
      try {
        return await Promise.race([
          this.sendEvalMessage(code)
        , timeoutReject(timeout)
        ])
      } catch(e) {
        if (e instanceof TimeoutError) {
          this.destory()
        }
        throw e
      }
    } else {
      return await this.sendEvalMessage(code)
    }
  }

  async execute(code, timeout) {
    await this.eval(code, timeout)
  }

  save() {
    // TODO
    this.history.push(_.cloneDeep(this.context))
  }

  restore() {
    // TODO
    this.context = this.history.pop()
  }

  clone() {
    // TODO
    return new Sandbox(this.context)
  }

  clear() {
    // TODO
    this.context = this.history[0]
    this.history = [this.context]
  }
}

export default Sandbox
