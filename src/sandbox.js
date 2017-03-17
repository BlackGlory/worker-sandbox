'use strict'

import uuidV4 from 'uuid/v4'
import { MessageSystem, PERMISSIONS } from './message-system'
import AdvancedWorker from 'worker-loader?inline&fallback=false!./worker.js'
import { createProxyHub, convertPathListToString } from './proxy-helper'

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

export class Sandbox extends MessageSystem {
  constructor() {
    let worker = new AdvancedWorker()
    super(worker, {}, [
      PERMISSIONS.SEND_ASSIGN
    , PERMISSIONS.SEND_EVAL
    , PERMISSIONS.SEND_CALL
    , PERMISSIONS.SEND_ACCESS
    , PERMISSIONS.SEND_REMOVE
    , PERMISSIONS.RECEIVE_CALL
    ])

    this.context = createProxyHub({}, {
      get: async (target, path) => {
        return await this.get(convertPathListToString(path))
      }
    , apply: async (target, path, caller, args) => {
        return await this.call(convertPathListToString(path), ...args)
      }
    , set: async (target, path, value) => {
        return await this.set(convertPathListToString(path), value)
      }
    , deleteProperty: async (target, path) => {
        return await this.remove(convertPathListToString(path))
      }
    })
  }

  async set(path, value) {
    await this.sendAssignMessage(path, value)
  }

  async assign(obj) {
    await Promise.all(
      Object.keys(obj).map(path => {
        this.set(path, obj[path])
      })
    )
  }

  async get(path) {
    let value = await this.sendAccessMessage(path)
    return value
  }

  async remove(path) {
    return await this.sendRemoveMessage(path)
  }

  async call(path, ...args) {
    return await this.sendCallMessage(path, ...args)
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

export default Sandbox
