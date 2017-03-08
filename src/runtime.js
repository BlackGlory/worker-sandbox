'use strict'

import uuidV4 from 'uuid/v4'
import { MessageSystem, PERMISSIONS } from './message-system'
import AdvancedWorker from 'worker-loader?inline&fallback=false!./worker.js'

export default class Runtime extends MessageSystem {
  constructor() {
    let context = {}
      , worker = new AdvancedWorker()
    super(worker, context, [
      PERMISSIONS.SEND_DEFINE
    , PERMISSIONS.SEND_EVAL
    , PERMISSIONS.RECEIVE_CALL
    ])
    this.context = context
    this.worker = worker
  }

  destory() {
    this.worker.terminate()
    this.worker = null
  }
}
