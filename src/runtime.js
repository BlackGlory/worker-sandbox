'use strict'

import uuidV4 from 'uuid/v4'
import { MessageSystem, PERMISSIONS } from './message-system'
import AdvancedWorker from 'worker-loader?inline&fallback=false!./worker.js'

export default class Runtime extends MessageSystem {
  constructor(context = {}) {
    let worker = new AdvancedWorker()
    super(worker, context, [
      PERMISSIONS.SEND_ASSIGN
    , PERMISSIONS.SEND_EVAL
    , PERMISSIONS.SEND_CALL
    , PERMISSIONS.SEND_ACCESS
    , PERMISSIONS.SEND_REMOVE
    , PERMISSIONS.RECEIVE_ERROR
    , PERMISSIONS.RECEIVE_CALL
    ])
  }

  destory() {
    this._worker.terminate()
    this._worker = null
  }
}
