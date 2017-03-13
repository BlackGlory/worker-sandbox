'use strict'

import uuidV4 from 'uuid/v4'
import EventTarget from 'event-target-shim'
import _ from 'lodash'
import { stringify, parse } from './json-helper'

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
, SEND_EVAL: 'send_eval'
, SEND_ASSIGN: 'send_assign'
, SEND_ACCESS: 'send_access'
, SEND_CALL: 'send_call'
, SEND_REMOVE: 'send_remove'
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

export class MessageSystem extends EventTarget {
  constructor(worker, context = {}, permissions = []) {
    super()

    worker.addEventListener('message', ({ data }) => ({
      [RESOLVED]({ id, result }) {
        if (result) {
          this._aliveMessages[id].resolve(parse(result))
        } else {
          this._aliveMessages[id].resolve(result)
        }
        delete this._aliveMessages[id]
      }
    , [REJECTED]({ id, error }) {
        this._aliveMessages[id].reject(parse(error))
        delete this._aliveMessages[id]
      }
    , [ASSIGN]({ id, name, value }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_ASSIGN)) {
            throw new PermissionError('No permission RECEIVE_ASSIGN')
          }
          this._context[name] = parse(value)
          this.sendResolvedMessage(id)
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [ACCESS]({ id, name }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_ACCESS)) {
            throw new PermissionError('No permission RECEIVE_ACCESS')
          }
          if (!this._context.hasOwnProperty(name)) {
            throw new ReferenceError(`${ name } is not defined`)
          }
          this.sendResolvedMessage(id, this._context[name])
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [REMOVE]({ id, name }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_REMOVE)) {
            throw new PermissionError('No permission RECEIVE_REMOVE')
          }
          delete this._context[name]
          this.sendResolvedMessage(id)
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [ERROR]({ error }) {
        this.dispatchError(parse(error))
      }
    , async [CALL]({ id, name, args }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_CALL)) {
            throw new PermissionError('No permission RECEIVE_CALL')
          }
          if (!this._context.hasOwnProperty(name)) {
             throw new ReferenceError(`${ name } is not defined`)
          }
          this.sendResolvedMessage(id, await this._context[name](...parse(args)))
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , async [EVAL]({ id, code }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_EVAL)) {
            throw new PermissionError('No permission RECEIVE_EVAL')
          }
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
  }

  dispatchError(error) {
    this.dispatchEvent(new CustomEvent('error', {
      detail: error
    }))
  }

  postMessage(...args) {
    if (!this._worker) {
      throw new Error('No available Worker instance.')
    }
    this._worker.postMessage(...args)
  }

  sendResolvedMessage(id, result) {
    this.postMessage({
      id
    , type: RESOLVED
    , result: stringify(result)
    })
  }

  sendRejectedMessage(id, error) {
    this.postMessage({
      id
    , type: REJECTED
    , error: stringify(error)
    })
  }

  sendEvalMessage(code) {
    if (!this._permissions.includes(PERMISSIONS.SEND_EVAL)) {
      throw new PermissionError('No permission SEND_EVAL')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: EVAL
      , code
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.postMessage(message)
    })
  }

  sendAssignMessage(name, value) {
    if (!this._permissions.includes(PERMISSIONS.SEND_ASSIGN)) {
      throw new PermissionError('No permission SEND_ASSIGN')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: ASSIGN
      , name
      , value: stringify(value)
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.postMessage(message)
    })
  }

  sendAccessMessage(name) {
    if (!this._permissions.includes(PERMISSIONS.SEND_ACCESS)) {
      throw new PermissionError('No permission SEND_ACCESS')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: ACCESS
      , name
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.postMessage(message)
    })
  }

  sendRemoveMessage(name) {
    if (!this._permissions.includes(PERMISSIONS.SEND_REMOVE)) {
      throw new PermissionError('No permission SEND_REMOVE')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: REMOVE
      , name
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.postMessage(message)
    })
  }

  sendCallMessage(name, ...args) {
    if (!this._permissions.includes(PERMISSIONS.SEND_CALL)) {
      throw new PermissionError('No permission SEND_CALL')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: CALL
      , name
      , args: stringify(args)
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.postMessage(message)
    })
  }

  sendErrorMessage(error) {
    this.postMessage({
      type: ERROR
    , error: stringify(error)
    })
  }
}
