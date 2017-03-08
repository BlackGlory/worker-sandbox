'use strict'

import _ from 'lodash'
import Runtime from './runtime'

export class TimeoutError extends Error {}

function timeoutReject(timeout, message) {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      reject(new TimeoutError(message))
    }, timeout)
  })
}

export default class Sandbox extends Runtime {
  constructor(context) {
    // TODO
    super()
    this.history = []
  }

  async define(name, value) {
    // TODO
    return await this.sendDefineMessage(name, value)
  }

  async call(name, ...args) {
    // TODO
    return await this.sendCallMessage(name, ...args)
  }

  async eval(code, timeout) {
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
