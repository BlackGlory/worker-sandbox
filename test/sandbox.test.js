import { expect } from 'chai'
import { Sandbox, TimeoutError } from '../src/sandbox'

describe('Sandbox', function() {
  /*
  describe('#save, #restore', function() {
    it('should save and restore context', async function() {
      let sandbox = new Sandbox()
      await sandbox.save()
      await sandbox.set('a', 12345)
      await sandbox.restore()
      try {
        await sandbox.get('a')
        expect(false).to.be.true
      } catch(e) {
        expect(e instanceof ReferenceError).to.be.true
      }
    })
  })

  describe('#clone', function() {
    it('should clone context and history to new instance', async function() {
      let sandbox = new Sandbox({
        a: 12345
      })
      await sandbox.save()
      await sandbox.set('a', 54321)
      let newSandbox = await sandbox.clone()
      expect(await newSandbox.get('a')).to.equal(54321)
      await newSandbox.restore()
      expect(await newSandbox.get('a')).to.equal(12345)
    })
  })
  */
})
