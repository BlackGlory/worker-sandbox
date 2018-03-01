'use strict'

import isFunction from 'lodash/isFunction'
import isArray from 'lodash/isArray'
import { MessageSystem, PERMISSIONS } from 'message-system'
import SandboxWorker from 'worker-loader?inline&name=worker.js!./worker.js'
import createAsyncProxyHub from 'async-proxy'
import { set, remove } from 'object-path-operator'

export class TimeoutError extends Error {
  constructor(...args) {
    super(...args)
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
    let worker = new SandboxWorker()

    super(worker, {}, [
      PERMISSIONS.SEND_ASSIGN
    , PERMISSIONS.SEND_EVAL
    , PERMISSIONS.SEND_CALL
    , PERMISSIONS.SEND_ACCESS
    , PERMISSIONS.SEND_REMOVE
    , PERMISSIONS.SEND_REGISTER
    , PERMISSIONS.RECEIVE_CALL
    ], [
      PERMISSIONS.RECEIVE_EVAL
    , PERMISSIONS.RECEIVE_CALL
    , PERMISSIONS.RECEIVE_ASSIGN
    , PERMISSIONS.RECEIVE_ACCESS
    , PERMISSIONS.RECEIVE_REMOVE
    , PERMISSIONS.RECEIVE_REGISTER
    , PERMISSIONS.SEND_CALL
    ])

    this.callable = createAsyncProxyHub(this._context, {
      set: (_, path, value) => {
        return this.registerCall(path, value)
      }
    , deleteProperty: (_, path) => {
        return this.cancelCall(path)
      }
    })

    this.context = createAsyncProxyHub({}, {
      get: async (_, path) => {
        return await this.get(path)
      }
    , apply: async (_, path, caller, args) => {
        return await this.call(path, ...args)
      }
    , set: (_, path, value) => {
        return this.set(path, value)
      }
    , deleteProperty: (_, path) => {
        return this.remove(path)
      }
    })
  }

  registerCall(path, func) {
    if (!isFunction(func)) {
      throw new TypeError('Only function can be registered')
    }
    set(this._context, path, func)
    return this.sendRegisterMessage(path)
  }

  cancelCall(path) {
    remove(this._context, path)
    return this.sendRemoveMessage(path)
  }

  async set(path, value) {
    await this.sendAssignMessage(path, value)
  }

  async assign(obj) {
    await Promise.all(
      Object.keys(obj).map(path => {
        this.set([path], obj[path])
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

  async eval(code, destroyTimeout) {
    if (isFunction(code)) {
      code = `(${ code })()`
    }
    if (destroyTimeout) {
      try {
        return await Promise.race([
          this.sendEvalMessage(code)
        , timeoutReject(destroyTimeout)
        ])
      } catch(e) {
        if (e instanceof TimeoutError) {
          this.destroy()
        }
        throw e
      }
    } else {
      return await this.sendEvalMessage(code)
    }
  }

  async execute(code, destroyTimeout) {
    await this.eval(code, destroyTimeout)
  }

  get available() {
    return !!this._worker
  }

  destroy() {
    if (this._worker) {
      this._worker.terminate()
      this._worker = null
      return true
    }
    return false
  }
}

export default Sandbox
