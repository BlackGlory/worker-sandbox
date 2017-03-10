import { expect } from 'chai'
import { Sandbox, TimeoutError } from '../src/sandbox'

describe('Sandbox', function() {
  describe('#execute', function() {
    it('should always return undefined', async function() {
      let sandbox = new Sandbox()
        , result = await sandbox.execute('12345')
      expect(result).to.be.undefined
    })
  })

  describe('#eval', function() {
    it('should return a literal when code return a literal', async function() {
      let sandbox = new Sandbox()
        , result = await sandbox.eval('12345')
      expect(result).to.equal(12345)
    })

    it('should return a Promise when code return a Promise', async function() {
      let sandbox = new Sandbox()
        , result = await sandbox.eval('Promise.resolve(12345)')
      expect(result).to.equal(12345)
    })

    it('should return a literal when function return a literal', async function() {
      let sandbox = new Sandbox()
        , result = await sandbox.eval(function() {
            return 12345
          })
      expect(result).to.equal(12345)
    })

    it('should throw a TimeoutError when timeout', async function() {
      let sandbox = new Sandbox()
      try {
        await sandbox.eval('new Promise(resolve => setTimeout(resolve, 10000))', 1000)
      } catch(e) {
        expect(e.name).to.equal('TimeoutError')
      }
    })
  })
})
