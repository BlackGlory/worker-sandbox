'use strict'

import uuidV4 from 'uuid/v4'

const RESOLVED = 'resolved'
const REJECTED = 'rejected'
const CALL = 'call'
const DEFINE = 'define'
const EVAL = 'eval'

export const PERMISSIONS = {
  RECEIVE_EVAL: 'receive_eval'
, RECEIVE_DEFINE: 'receive_define'
, RECEIVE_CALL: 'receive_call'
, SEND_EVAL: 'send_eval'
, SEND_DEFINE: 'send_define'
, SEND_CALL: 'send_call'
}

export class PermissionError extends Error {}

function serializeError(err) {
  return JSON.stringify({
    name: err.name
  , message: err.message
  , stack: err.stack
  })
}

function unserializeError(str) {
  let { name, message, stack } = JSON.parse(str)
    , err = new this[name](message)
  err.stack = stack
  return err
}

function runInContext(code, context) {
  return eval.bind(context)(code)
}

export class MessageSystem {
  constructor(worker, context, permissions) {
    worker.addEventListener('message', ({ data }) => ({
      [RESOLVED]({ id, result }) {
        this._aliveMessages[id].resolve(result)
        delete this._aliveMessages[id]
      }
    , [REJECTED]({ id, error }) {
        this._aliveMessages[id].reject(unserializeError(error))
        delete this._aliveMessages[id]
      }
    , [DEFINE]({ name, value }) {
        // TODO
        if (!this._permissions.includes(PERMISSIONS.RECEIVE_DEFINE)) {
          throw new PermissionError('No permission RECEIVE_DEFINE')
        }
        if (name) {
          this._context[name] = value
        }
      }
    , async [CALL]({ id, name, args }) {
        // TODO
        if (!this._permissions.includes(PERMISSIONS.RECEIVE_CALL)) {
          throw new PermissionError('No permission RECEIVE_CALL')
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
          throw new PermissionError('No permission RECEIVE_EVAL')
        }
        try {
          this.sendResolvedMessage(id, await runInContext(code, this._context))
        } catch(e) {
          this.sendRejectedMessage(id, e)
        }
      }
    })[data.type].bind(this)(data))

    worker.addEventListener('error', error => { throw error })

    this._worker = worker
    this._context = context
    this._permissions = permissions
    this._aliveMessages = {}
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
      throw new PermissionError('No permission SEND_EVAL')
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

  sendDefineMessage(name, value) {
    // TODO
    if (!this._permissions.includes(PERMISSIONS.SEND_DEFINE)) {
      throw new PermissionError('No permission SEND_DEFINE')
    }
    this._worker.postMessage({
      type: DEFINE
    , name
    , value
    })
  }

  sendCallMessage(name, ...args) {
    // TODO
    if (!this._permissions.includes(PERMISSIONS.SEND_CALL)) {
      throw new PermissionError('No permission SEND_CALL')
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
}
