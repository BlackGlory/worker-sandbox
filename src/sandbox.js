'use strict'

import uuidV4 from 'uuid/v4'
import isFunction from 'lodash/isFunction'
import { MessageSystem, PERMISSIONS } from './message-system'
import SandboxWorker from 'worker-loader?inline&name=worker.js!./worker.js'
import {
  createAsyncProxyHub
, convertPathListToString
, setPropertyByPath
, deletePropertyByPath
} from './proxy-helper'

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
    ])

    this.callable = createAsyncProxyHub(this._context, {
      set: (target, path, value) => {
        if (!isFunction(value)) {
          throw new TypeError('value must be function')
        }
        return this.registerCall(convertPathListToString(path), value)
      }
    , deleteProperty: async (target, path) => {
        return await this.cancelCall(convertPathListToString(path))
      }
    })

    this.context = createAsyncProxyHub({}, {
      get: async (_, path) => {
        return await this.get(convertPathListToString(path))
      }
    , apply: async (_, path, caller, args) => {
        return await this.call(convertPathListToString(path), ...args)
      }
    , set: async (_, path, value) => {
        return await this.set(convertPathListToString(path), value)
      }
    , deleteProperty: async (_, path) => {
        return await this.remove(convertPathListToString(path))
      }
    })
  }

  async registerCall(path, func) {
    setPropertyByPath(this._context, path, func)
    return await this.sendRegisterMessage(path)
  }

  async cancelCall(path) {
    deletePropertyByPath(this._context, path)
    return await this.sendRemoveMessage(path)
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

  async eval(code, destoryTimeout) {
    if (isFunction(code)) {
      code = `(${ code })()`
    }
    if (destoryTimeout) {
      try {
        return await Promise.race([
          this.sendEvalMessage(code)
        , timeoutReject(destoryTimeout)
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

  async execute(code, destoryTimeout) {
    await this.eval(code, destoryTimeout)
  }

  get available() {
    return !!this._worker
  }

  destory() {
    if (this._worker) {
      this._worker.terminate()
      this._worker = null
      return true
    }
    return false
  }
}

export default Sandbox
