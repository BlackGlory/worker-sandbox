'use strict'

import {
  MessageSystem
, PERMISSIONS
} from 'message-system'
import { expect } from 'chai'

self.window = self

async function testRemotePermissions() {
  let messenger = new MessageSystem(self, {}, [
    PERMISSIONS.SEND_ASSIGN
  , PERMISSIONS.SEND_EVAL
  , PERMISSIONS.SEND_CALL
  , PERMISSIONS.SEND_ACCESS
  , PERMISSIONS.SEND_REMOVE
  , PERMISSIONS.SEND_REGISTER
  ], [
    PERMISSIONS.RECEIVE_EVAL
  , PERMISSIONS.RECEIVE_CALL
  , PERMISSIONS.RECEIVE_ASSIGN
  , PERMISSIONS.RECEIVE_ACCESS
  , PERMISSIONS.RECEIVE_REMOVE
  , PERMISSIONS.RECEIVE_REGISTER
  ])
  try {
    await messenger.sendEvalMessage()
  } catch(e) {
    try {
      await messenger.sendCallMessage()
    } catch(e) {
      try {
        await messenger.sendRegisterMessage()
      } catch(e) {
        try {
          await messenger.sendAssignMessage()
        } catch(e) {
          try {
            await messenger.sendAccessMessage()
          } catch(e) {
            try {
              await messenger.sendRemoveMessage()
            } catch(e) {
              self.postMessage('ok')
            }
          }
        }
      }
    }
  }
}

async function testPermissions() {
  let messenger = new MessageSystem(self, {
    sayGoodbye() {
      return 'Goodbye'
    }
  }, [
    PERMISSIONS.SEND_ASSIGN
  , PERMISSIONS.SEND_EVAL
  , PERMISSIONS.SEND_CALL
  , PERMISSIONS.SEND_ACCESS
  , PERMISSIONS.SEND_REMOVE
  , PERMISSIONS.SEND_REGISTER
  , PERMISSIONS.RECEIVE_CALL
  ], [
    PERMISSIONS.RECEIVE_EVAL
  , PERMISSIONS.RECEIVE_CALL
  , PERMISSIONS.RECEIVE_ASSIGN
  , PERMISSIONS.RECEIVE_ACCESS
  , PERMISSIONS.RECEIVE_REMOVE
  , PERMISSIONS.RECEIVE_REGISTER
  , PERMISSIONS.SEND_CALL
  ])

  try {
    await messenger.sendEvalMessage()
  } catch(e) {
    try {
      await messenger.sendCallMessage()
    } catch(e) {
      try {
        await messenger.sendRegisterMessage()
      } catch(e) {
        try {
          await messenger.sendAssignMessage()
        } catch(e) {
          try {
            await messenger.sendAccessMessage()
          } catch(e) {
            try {
              await messenger.sendRemoveMessage()
            } catch(e) {
              self.postMessage('ok')
            }
          }
        }
      }
    }
  }
}

async function testReceiveMessages() {
  let messenger = new MessageSystem(self, {
    sayGoodbye() {
      return 'Goodbye'
    }
  }, [
    PERMISSIONS.SEND_ASSIGN
  , PERMISSIONS.SEND_EVAL
  , PERMISSIONS.SEND_CALL
  , PERMISSIONS.SEND_ACCESS
  , PERMISSIONS.SEND_REMOVE
  , PERMISSIONS.SEND_REGISTER
  , PERMISSIONS.RECEIVE_CALL
  ], [
    PERMISSIONS.RECEIVE_EVAL
  , PERMISSIONS.RECEIVE_CALL
  , PERMISSIONS.RECEIVE_ASSIGN
  , PERMISSIONS.RECEIVE_ACCESS
  , PERMISSIONS.RECEIVE_REMOVE
  , PERMISSIONS.RECEIVE_REGISTER
  , PERMISSIONS.SEND_CALL
  ])

  expect(await messenger.sendEvalMessage('12345')).to.equal(12345)
  expect(await messenger.sendCallMessage('sayHello')).to.equal('Hello')
  await messenger.sendRegisterMessage('sayGoodbye')
  await messenger.sendAssignMessage('assignTest', 54321)
  expect(await messenger.sendAccessMessage('assignTest')).to.equal(54321)
  await messenger.sendRemoveMessage('assignTest')
  setTimeout(() => {
    throw new Error('just a joke')
  }, 0)
}

self.addEventListener('message', ({ data }) => {
  switch (data) {
    case 'PermissionsTest':
      testPermissions()
      break
    case 'ReceiveMessagesTest':
      testReceiveMessages()
      break
    case 'RemotePermissionsTest':
      testRemotePermissions()
      break
  }
})
