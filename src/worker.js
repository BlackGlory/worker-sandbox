'use strict'

import { MessageSystem, PERMISSIONS } from './message-system'

self.window = self

new MessageSystem(self, {}, [
  PERMISSIONS.RECEIVE_EVAL
, PERMISSIONS.RECEIVE_CALL
, PERMISSIONS.RECEIVE_ASSIGN
, PERMISSIONS.RECEIVE_ACCESS
, PERMISSIONS.RECEIVE_REMOVE
, PERMISSIONS.RECEIVE_REGISTER
, PERMISSIONS.SEND_CALL
], [
  PERMISSIONS.SEND_ASSIGN
, PERMISSIONS.SEND_EVAL
, PERMISSIONS.SEND_CALL
, PERMISSIONS.SEND_ACCESS
, PERMISSIONS.SEND_REMOVE
, PERMISSIONS.SEND_REGISTER
, PERMISSIONS.RECEIVE_CALL
])
