'use strict'

import { expect } from 'chai'
import { MessageSystem, PERMISSIONS, PermissionError } from '../src/message-system'
import MockWorker from 'worker-loader?inline&fallback=false!./mock-worker.js'

describe('MessageSystem', function() {
  describe('PermissionsError', function() {
    it('should throw PermissionsError when send message', function() {
      let messenger = new MessageSystem(self)
      expect(() => messenger.sendCallMessage()).to.throw(PermissionError)
      expect(() => messenger.sendRemoveMessage()).to.throw(PermissionError)
      expect(() => messenger.sendAccessMessage()).to.throw(PermissionError)
      expect(() => messenger.sendAssignMessage()).to.throw(PermissionError)
      expect(() => messenger.sendRegisterMessage()).to.throw(PermissionError)
      expect(() => messenger.sendEvalMessage()).to.throw(PermissionError)
    })

    it('should send error message', function(done) {
      let worker = new MockWorker()
        , messenger = new MessageSystem(worker)
      worker.addEventListener('error', ({ detail: error }) => {
        expect(error.message).to.equal('just a joke')
        done()
      })
      worker.dispatchEvent(new CustomEvent('error', { detail: new Error('just a joke') }))
    })

    it('should return PermissionsError when receive message', function(done) {
      let worker = new MockWorker()
        , messenger = new MessageSystem(worker)
      worker.addEventListener('message', ({ data }) => {
        if (data === 'ok') {
          done()
        }
      })
      worker.postMessage('PermissionsTest')
    })

    it('should receive messages', function(done) {
      let worker = new MockWorker()
        , context = {
            sayHello() {
              return 'Hello'
            }
          }
        , messenger = new MessageSystem(worker, context, [
            PERMISSIONS.RECEIVE_REGISTER
          , PERMISSIONS.RECEIVE_REMOVE
          , PERMISSIONS.RECEIVE_CALL
          , PERMISSIONS.RECEIVE_ACCESS
          , PERMISSIONS.RECEIVE_EVAL
          , PERMISSIONS.RECEIVE_ASSIGN
          , PERMISSIONS.SEND_CALL
          ])
      worker.addEventListener('message', async ({ data }) => {
        if (data === 'ok') {
          expect(await context.sayGoodbye()).to.equal('Goodbye')
          done()
        }
      })
      worker.postMessage('ReceiveMessagesTest')
    })
  })

  describe('EventTarget', function() {
    it('should trigger event', function(done) {
      let messenger = new MessageSystem(self)
      messenger.addEventListener('error', function({ detail }) {
        expect(detail.message).to.equal('just a joke')
        done()
      })
      messenger.dispatchError(new Error('just a joke'))
    })
  })
})
