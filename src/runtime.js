'use strict'

import uuidV4 from 'uuid/v4'
import { MessageSystem, PERMISSIONS } from './message-system'
import AdvancedWorker from 'worker-loader?inline&fallback=false!./worker.js'

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

export class Runtime extends MessageSystem {
  constructor(context = {}) {
    let worker = new AdvancedWorker()
    super(worker, context, [
      PERMISSIONS.SEND_ASSIGN
    , PERMISSIONS.SEND_EVAL
    , PERMISSIONS.SEND_CALL
    , PERMISSIONS.SEND_ACCESS
    , PERMISSIONS.SEND_REMOVE
    , PERMISSIONS.RECEIVE_CALL
    ])
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

  destory() {
    this._worker.terminate()
    this._worker = null
  }
}

export default Runtime
