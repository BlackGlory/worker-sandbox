'use strict'

import { MessageSystem, PERMISSIONS } from './message-system'

self.window = self

new MessageSystem(self, self.window, [
  PERMISSIONS.RECEIVE_EVAL
, PERMISSIONS.RECEIVE_DEFINE
, PERMISSIONS.SEND_CALL
])
