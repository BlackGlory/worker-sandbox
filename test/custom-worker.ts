import { MessageSystem, PERMISSION } from 'message-system'
import { WorkerMessenger } from 'message-system-worker-messenger'

function sayGoodBye() {
  return 'GoodBye'
}

(self as any)['window'] = self

new MessageSystem(new WorkerMessenger(), [
  PERMISSION.RECEIVE.EVAL
, PERMISSION.RECEIVE.CALL
, PERMISSION.RECEIVE.ASSIGN
, PERMISSION.RECEIVE.ACCESS
, PERMISSION.RECEIVE.REMOVE
, PERMISSION.RECEIVE.REGISTER
, PERMISSION.SEND.CALL
], {
  sayHello() {
    return 'Hello'
  }
})
