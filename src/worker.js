'use strict'

import { MessageSystem, PERMISSIONS } from './message-system'

self.window = self

new MessageSystem(self, self.window, [
  PERMISSIONS.RECEIVE_EVAL
, PERMISSIONS.RECEIVE_ASSIGN
, PERMISSIONS.RECEIVE_ACCESS
, PERMISSIONS.RECEIVE_REMOVE
, PERMISSIONS.SEND_CALL
, PERMISSIONS.SEND_ERROR
])
