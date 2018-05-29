import { MessageSystem, PERMISSION } from 'message-system'
import { WorkerMessenger } from 'message-system-worker-messenger'
import createAsyncProxyHub, { AsyncProxyHandler } from 'async-proxy'
import {
  setPropertyByPathList
, removePropertyByPathList
, setPropertyByPathString
, removePropertyByPathString
} from 'object-path-operator'
import SandboxWorker = require('worker-loader?inline&name=worker.js!./worker')

function isFunction(obj: any) {
  return typeof obj === 'function'
}

export class Sandbox {
  private localContext: any = {}
  private remote: MessageSystem

  callable: any = createAsyncProxyHub(this.localContext, {
    set: (_, path: string[], value: any) => {
      return this.registerCall(path, value)
    }
  , deleteProperty: (_, path: string[]) => {
      return this.cancelCall(path)
    }
  })

  context: any = createAsyncProxyHub(undefined, {
    get: async (_, path: string[]) => {
      return await this.get(path)
    }
  , apply: async (_, path: string[], caller: any, args: any[]) => {
      return await this.call(path, ...args)
    }
  , set: (_, path: string[], value: any) => {
      return this.set(path, value)
    }
  , deleteProperty: (_, path: string[]) => {
      return this.remove(path)
    }
  })

  constructor(worker: Worker = new SandboxWorker()) {
    this.remote = new MessageSystem(new WorkerMessenger(worker), [
      PERMISSION.SEND.ASSIGN
    , PERMISSION.SEND.EVAL
    , PERMISSION.SEND.CALL
    , PERMISSION.SEND.ACCESS
    , PERMISSION.SEND.REMOVE
    , PERMISSION.SEND.REGISTER
    , PERMISSION.RECEIVE.CALL
    ], this.localContext)
  }

  destroy(): void {
    return this.remote.terminate()
  }

  registerCall(path: string | string[], func: (...args: any[]) => any): Promise<void> {
    if (!isFunction(func)) {
      throw new TypeError('Only function can be registered')
    }
    if (Array.isArray(path)) {
      setPropertyByPathList(this.localContext, path, func)
    } else {
      setPropertyByPathString(this.localContext, path, func)
    }
    return this.remote.sendRegisterMessage(path)
  }

  cancelCall(path: string | string[]): Promise<void> {
    if (Array.isArray(path)) {
      removePropertyByPathList(this.localContext, path)
    } else {
      removePropertyByPathString(this.localContext, path)
    }
    return this.remote.sendRemoveMessage(path)
  }

  async set(path: string | string[], value: any): Promise<void> {
    await this.remote.sendAssignMessage(path, value)
  }

  async assign(obj: any): Promise<void> {
    await Promise.all(Object.keys(obj).map(path => this.set([path], obj[path])))
  }

  async get(path: string | string[]): Promise<any> {
    return await this.remote.sendAccessMessage(path)
  }

  async remove(path: string | string[]): Promise<void> {
    await this.remote.sendRemoveMessage(path)
  }

  async call(path: string | string[], ...args: any[]): Promise<any> {
    return await this.remote.sendCallMessage(path, ...args)
  }

  async eval(code: string): Promise<any> {
    return await this.remote.sendEvalMessage(code)
  }

  async execute(code: string): Promise<void> {
    await this.remote.sendEvalMessage(code)
  }
}

export default Sandbox
