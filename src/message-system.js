'use strict'

import uuidV4 from 'uuid/v4'
import EventTarget from 'event-target-shim'
import initJSONHelper from './json-helper'
import {
  getPropertyByPath
, setPropertyByPath
, deletePropertyByPath
} from './proxy-helper'
import runInContext from './run-in-context'

const RESOLVED = 'resolved'
const REJECTED = 'rejected'
const CALL = 'call'
const ASSIGN = 'assign'
const ACCESS = 'access'
const EVAL = 'eval'
const REMOVE = 'remove'
const REGISTER = 'register'

export const PERMISSIONS = {
  RECEIVE_EVAL: 'receive_eval'
, RECEIVE_ASSIGN: 'receive_assign'
, RECEIVE_ACCESS: 'receive_access'
, RECEIVE_CALL: 'receive_call'
, RECEIVE_REMOVE: 'receive_remove'
, RECEIVE_REGISTER: 'receive_register'
, SEND_EVAL: 'send_eval'
, SEND_ASSIGN: 'send_assign'
, SEND_ACCESS: 'send_access'
, SEND_CALL: 'send_call'
, SEND_REMOVE: 'send_remove'
, SEND_REGISTER: 'send_register'
}

export class PermissionError extends Error {
  constructor(...args) {
    super(...args)
    this.name = 'PermissionError'
  }
}

export class MessageSystem extends EventTarget {
  constructor(worker, context = {}, permissions = []) {
    super()

    /*
    if (!['Worker', 'DedicatedWorkerGlobalScope'].includes(worker.constructor.name)) {
      throw new TypeError('First argument of MessageSystem constructor must be Worker or DedicatedWorkerGlobalScope')
    }
    */

    const { stringify, parse } = initJSONHelper(context)

    this.stringify = stringify
    this.parse = parse

    this._worker = worker
    this._permissions = permissions
    this._aliveMessages = {}
    this._context = context

    if (this._worker.constructor.name === 'Worker') {
      const errorHandler = evt => {
        if (evt && evt.message) {
          this.dispatchEvent(new CustomEvent('error', {
            detail: new Error(evt.message)
          }))
        } else {
          this.dispatchEvent(new CustomEvent('error', {
            detail: new Error(`${ evt }`)
          }))
        }
        evt.preventDefault()
      }

      worker.addEventListener('error', errorHandler)
      worker.addEventListener('unhandledrejection', errorHandler) // The event has not been implemented by the browser
    }

    worker.addEventListener('message', ({ data }) => (({
      [RESOLVED]({ id, result }) {
        if (result) {
          this._aliveMessages[id].resolve(this.parse(result))
        } else {
          this._aliveMessages[id].resolve(result)
        }
        delete this._aliveMessages[id]
      }
    , [REJECTED]({ id, error }) {
        this._aliveMessages[id].reject(this.parse(error))
        delete this._aliveMessages[id]
      }
    , [ASSIGN]({ id, path, value }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_ASSIGN)) {
            throw new PermissionError('No permission RECEIVE_ASSIGN')
          }
          setPropertyByPath(this._context, path, this.parse(value))
          this.sendResolvedMessage(id)
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [REGISTER]({ id, path }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_REGISTER)) {
            throw new PermissionError('No permission RECEIVE_REGISTER')
          }
          let fn = (...args) => this.sendCallMessage(path, ...args)
          setPropertyByPath(this._context, path, fn)
          this.sendResolvedMessage(id)
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [ACCESS]({ id, path }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_ACCESS)) {
            throw new PermissionError('No permission RECEIVE_ACCESS')
          }
          this.sendResolvedMessage(id, getPropertyByPath(this._context, path))
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [REMOVE]({ id, path }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_REMOVE)) {
            throw new PermissionError('No permission RECEIVE_REMOVE')
          }
          deletePropertyByPath(this._context, path)
          this.sendResolvedMessage(id)
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , async [CALL]({ id, path, args }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_CALL)) {
            throw new PermissionError('No permission RECEIVE_CALL')
          }
          let fn = await getPropertyByPath(this._context, path)
          this.sendResolvedMessage(id, await fn(...this.parse(args)))
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
    })[data.type] || (() => {})).bind(this)(data))
  }

  sendMessage(messageObject) {
    if (!this._worker) {
      throw new Error('No available Worker instance.')
    }
    this._worker.postMessage(messageObject)
  }

  sendResolvedMessage(id, result) {
    this.sendMessage({
      id
    , type: RESOLVED
    , result: this.stringify(result)
    })
  }

  sendRejectedMessage(id, error) {
    this.sendMessage({
      id
    , type: REJECTED
    , error: this.stringify(error)
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
      this.sendMessage(message)
    })
  }

  sendRegisterMessage(path) {
    if (!this._permissions.includes(PERMISSIONS.SEND_REGISTER)) {
      throw new PermissionError('No permission SEND_REGISTER')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: REGISTER
      , path
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.sendMessage(message)
    })
  }

  sendAssignMessage(path, value) {
    if (!this._permissions.includes(PERMISSIONS.SEND_ASSIGN)) {
      throw new PermissionError('No permission SEND_ASSIGN')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: ASSIGN
      , path
      , value: this.stringify(value)
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.sendMessage(message)
    })
  }

  sendAccessMessage(path) {
    if (!this._permissions.includes(PERMISSIONS.SEND_ACCESS)) {
      throw new PermissionError('No permission SEND_ACCESS')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: ACCESS
      , path
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.sendMessage(message)
    })
  }

  sendRemoveMessage(path) {
    if (!this._permissions.includes(PERMISSIONS.SEND_REMOVE)) {
      throw new PermissionError('No permission SEND_REMOVE')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: REMOVE
      , path
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.sendMessage(message)
    })
  }

  sendCallMessage(path, ...args) {
    if (!this._permissions.includes(PERMISSIONS.SEND_CALL)) {
      throw new PermissionError('No permission SEND_CALL')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: CALL
      , path
      , args: this.stringify(args)
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.sendMessage(message)
    })
  }
}

export default MessageSystem
