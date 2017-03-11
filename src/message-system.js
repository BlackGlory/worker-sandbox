'use strict'

import uuidV4 from 'uuid/v4'
import EventTarget from 'event-target'
import {
  serializeFunction, unserializeFunction
, serializeError, unserializeError
} from './serialize'
import _ from 'lodash'

const RESOLVED = 'resolved'
const REJECTED = 'rejected'
const CALL = 'call'
const ASSIGN = 'assign'
const ACCESS = 'access'
const EVAL = 'eval'
const REMOVE = 'remove'
const ERROR = 'error'

export const PERMISSIONS = {
  RECEIVE_EVAL: 'receive_eval'
, RECEIVE_ASSIGN: 'receive_assign'
, RECEIVE_ACCESS: 'receive_access'
, RECEIVE_CALL: 'receive_call'
, RECEIVE_REMOVE: 'receive_remove'
, RECEIVE_ERROR: 'receive_error'
, SEND_EVAL: 'send_eval'
, SEND_ASSIGN: 'send_assign'
, SEND_ACCESS: 'send_access'
, SEND_CALL: 'send_call'
, SEND_REMOVE: 'send_remove'
, SEND_ERROR: 'send_error'
}

export class PermissionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PermissionError'
  }
}

function runInContext(code, context) {
  return eval.bind(context)(code)
}

export class MessageSystem {
  constructor(worker, context = {}, permissions = []) {
    worker.addEventListener('message', ({ data }) => ({
      [RESOLVED]({ id, result }) {
        this._aliveMessages[id].resolve(result)
        delete this._aliveMessages[id]
      }
    , [REJECTED]({ id, error }) {
        this._aliveMessages[id].reject(unserializeError(error))
        delete this._aliveMessages[id]
      }
    , [ASSIGN]({ id, name, value }) {
        if (!this._permissions.includes(PERMISSIONS.RECEIVE_ASSIGN)) {
          return// throw new PermissionError('No permission RECEIVE_ASSIGN')
        }
        try {
          this._context[name] = value
          this.sendResolvedMessage(id)
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [ACCESS]({ id, name }) {
        if (!this._permissions.includes(PERMISSIONS.RECEIVE_ACCESS)) {
          return// throw new PermissionError('No permission RECEIVE_ACCESS')
        }
        try {
          let value = this._context[name]
          if (_.isFunction(value)) {
            return this.sendResolvedMessage(id, serializeFunction(value))
          }
          this.sendResolvedMessage(id, value)
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [REMOVE]({ id, name }) {
        if (!this._permissions.includes(PERMISSIONS.RECEIVE_REMOVE)) {
          return// throw new PermissionError('No permission RECEIVE_REMOVE')
        }
        try {
          delete this._context[name]
          this.sendResolvedMessage(id)
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [ERROR]({ error }) {
        if (!this._permissions.includes(PERMISSIONS.RECEIVE_ERROR)) {
          return// throw new PermissionError('No permission RECEIVE_ERROR')
        }
        this.dispatchEvent(new CustomEvent('error', {
          details: error
        }))
      }
    , async [CALL]({ id, name, args }) {
        // TODO
        if (!this._permissions.includes(PERMISSIONS.RECEIVE_CALL)) {
          return// throw new PermissionError('No permission RECEIVE_CALL')
        }
        if (typeof this._context[name] !== 'undefined') {
          try {
            this.sendResolvedMessage(id, await this._context[name](...args))
          } catch(e) {
            this.sendRejectedMessage(id, e)
          }
        } else {
          this.sendRejectedMessage(id, new ReferenceError(`${ name } is not defined`))
        }
      }
    , async [EVAL]({ id, code }) {
        if (!this._permissions.includes(PERMISSIONS.RECEIVE_EVAL)) {
          return// throw new PermissionError('No permission RECEIVE_EVAL')
        }
        try {
          this.sendResolvedMessage(id, await runInContext(code, this._context))
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    })[data.type].bind(this)(data))

    worker.addEventListener('error', error => this.sendErrorMessage(error))

    this._worker = worker
    this._permissions = permissions
    this._aliveMessages = {}
    this._context = context
    this.context = new Proxy(this._context, {
      set: (obj, name, value) => {
        obj[name] = value
        this.sendAssignMessage(name, value)
        return true
      }
    , deleteProperty: (obj, name) => {
        delete obj[name]
        this.sendRemoveMessage(name)
      }
    })
    for (let name of Object.keys(context)) {
      this.sendAssignMessage(name, context[name])
    }
  }

  sendResolvedMessage(id, result) {
    this._worker.postMessage({
      id
    , type: RESOLVED
    , result
    })
  }

  sendRejectedMessage(id, error) {
    this._worker.postMessage({
      id
    , type: REJECTED
    , error: serializeError(error)
    })
  }

  sendEvalMessage(code) {
    if (!this._permissions.includes(PERMISSIONS.SEND_EVAL)) {
      return //throw new PermissionError('No permission SEND_EVAL')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: EVAL
      , code
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this._worker.postMessage(message)
    })
  }

  sendAssignMessage(name, value) {
    if (!this._permissions.includes(PERMISSIONS.SEND_ASSIGN)) {
      return //throw new PermissionError('No permission SEND_ASSIGN')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: ASSIGN
      , name
      , value
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this._worker.postMessage(message)
    })
  }

  sendAccessMessage(name) {
    if (!this._permissions.includes(PERMISSIONS.SEND_ACCESS)) {
      return //throw new PermissionError('No permission SEND_ACCESS')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: ACCESS
      , name
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this._worker.postMessage(message)
    })
  }

  sendRemoveMessage(name) {
    if (!this._permissions.includes(PERMISSIONS.SEND_REMOVE)) {
      return// throw new PermissionError('No permission SEND_REMOVE')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: REMOVE
      , name
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this._worker.postMessage(message)
    })
  }

  sendCallMessage(name, ...args) {
    // TODO
    if (!this._permissions.includes(PERMISSIONS.SEND_CALL)) {
      return// throw new PermissionError('No permission SEND_CALL')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: CALL
      , name
      , args
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this._worker.postMessage(message)
    })
  }

  sendErrorMessage(error) {
    if (!this._permissions.includes(PERMISSIONS.SEND_ERROR)) {
      return// throw new PermissionError('No permission SEND_ERROR')
    }
    this._worker.postMessage({
      type: ERROR
    , error: serializeError(error)
    })
  }
}
MessageSystem.prototype.addEventListener = EventTarget.addEventListener
MessageSystem.prototype.removeEventListener = EventTarget.removeEventListener
MessageSystem.prototype.dispatchEvent = EventTarget.dispatchEvent
