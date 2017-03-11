'use strict'

import _ from 'lodash'
import Runtime from './runtime'
import {
  serializeFunction, unserializeFunction
} from './serialize'

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
    if (_.isPlainObject(name)) {
      let obj = name
      return await Promise.all(
        // TODO
        Object.keys(obj).map(key => this.sendAssignMessage(key, obj[key]))
      )
    }
    if (_.isFunction(value)) {
      let fn = value
      return await this.sendAssignMessage(name, serializeFunction(fn))
    }
    return await this.sendAssignMessage(name, value)
  }

  async get(name) {
    let value = await this.sendAccessMessage(name)
    return value
  }

  async call(name, ...args) {
    // TODO
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
