'use strict'

import uuidV4 from 'uuid/v4'
import EventTarget from 'event-target-shim'
import { stringify, parse } from './json-helper'
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
const ERROR = 'error'
const DEFINE = 'define'

export const PERMISSIONS = {
  RECEIVE_EVAL: 'receive_eval'
, RECEIVE_ASSIGN: 'receive_assign'
, RECEIVE_ACCESS: 'receive_access'
, RECEIVE_CALL: 'receive_call'
, RECEIVE_REMOVE: 'receive_remove'
, RECEIVE_DEFINE: 'receive_define'
, SEND_EVAL: 'send_eval'
, SEND_ASSIGN: 'send_assign'
, SEND_ACCESS: 'send_access'
, SEND_CALL: 'send_call'
, SEND_REMOVE: 'send_remove'
, SEND_DEFINE: 'send_define'
}

export class PermissionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PermissionError'
  }
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
    , [ASSIGN]({ id, path, value }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_ASSIGN)) {
            throw new PermissionError('No permission RECEIVE_ASSIGN')
          }
          setPropertyByPath(this._context, path, parse(value))
          this.sendResolvedMessage(id)
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    , [DEFINE]({ id, path }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_DEFINE)) {
            throw new PermissionError('No permission RECEIVE_DEFINE')
          }
          setPropertyByPath(this._context, path, async (...args) =>
            await this.sendCallMessage(path, ...args))
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
    , [ERROR]({ error }) {
        this.dispatchError(parse(error))
      }
    , async [CALL]({ id, path, args }) {
        try {
          if (!this._permissions.includes(PERMISSIONS.RECEIVE_CALL)) {
            throw new PermissionError('No permission RECEIVE_CALL')
          }
          this.sendResolvedMessage(id, await getPropertyByPath(this._context, path)(...parse(args)))
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

  sendDefineMessage(path) {
    if (!this._permissions.includes(PERMISSIONS.SEND_DEFINE)) {
      throw new PermissionError('No permission SEND_DEFINE')
    }
    return new Promise((resolve, reject) => {
      let message = {
        id: uuidV4()
      , type: DEFINE
      , path
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.postMessage(message)
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
      , value: stringify(value)
      }
      this._aliveMessages[message.id] = { resolve, reject }
      this.postMessage(message)
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
      this.postMessage(message)
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
      this.postMessage(message)
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
