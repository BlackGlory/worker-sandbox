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

    it('should return new value', async function() {
      let sandbox = new Sandbox()
      await sandbox.execute('self.a = "hello world"')
      let result = await sandbox.eval('a')
      expect(result).to.equal('hello world')
    })

    it('should throw a TimeoutError', async function() {
      let sandbox = new Sandbox()
      try {
        await sandbox.eval('new Promise(resolve => setTimeout(resolve, 10000))', 1000)
        expect(false).to.be.true
      } catch(e) {
        expect(e instanceof TimeoutError).to.be.true
      }
    })

    it('should throw a SyntaxError', async function() {
      let sandbox = new Sandbox()
      try {
        await sandbox.eval('*****', 1000)
        expect(false).to.be.true
      } catch(e) {
        expect(e instanceof SyntaxError).to.be.true
      }
    })
  })

  describe('#registerCall, #cancelCall', function() {
    it('should register a callable function', async function() {
      const a = 'Hello'
      let sandbox = new Sandbox()
      await sandbox.registerCall('sayHello', function() {
        return a
      })
      expect(await sandbox.eval('sayHello()')).to.equal(a)
    })

    it('should cancel a callable function', async function() {
      const a = 'Hello'
      let sandbox = new Sandbox()
      await sandbox.registerCall('sayHello', function() {
        return a
      })
      await sandbox.cancelCall('sayHello')
      try {
        await sandbox.eval('sayHello()')
        expect(false).to.be.true
      } catch(e) {
        expect(e instanceof ReferenceError).to.be.true
      }
    })
  })

  describe('#context', function() {
    it('should accesible', async function() {
      let sandbox = new Sandbox()
      await sandbox.assign({
        a: 12345
      , b() {
          return 12345
        }
      , c: {
          a: 12345
        , b() {
            return 12345
          }
        }
      })
      expect(await sandbox.context.a).to.equal(12345)
      expect((await sandbox.context.b)()).to.equal(12345)
      expect(await sandbox.context.b()).to.equal(12345)
      expect(await sandbox.context.c.a).to.equal(12345)
      expect((await sandbox.context.c.b)()).to.equal(12345)
      expect(await sandbox.context.c.b()).to.equal(12345)
    })
  })

  describe('#callable', function() {
    it('should get, set, delete', async function() {
      let sandbox = new Sandbox()
      try {
        sandbox.callable.num = 12345
        expect(false).to.be.true
      } catch(e) {
        expect(e.message).to.equal('value must be function')
      }
      sandbox.callable.fn = () => 12345
      expect(await sandbox.callable.fn()).to.equal(12345)
      delete sandbox.callable.fn
      expect(await sandbox.callable.fn).to.be.undefined
    })
  })

  describe('#context', function() {
    it('should get, set, delete', async function() {
      let sandbox = new Sandbox()
      sandbox.context.num = 12345
      expect(await sandbox.context.num).to.equal(12345)
      delete sandbox.context.num
      expect(await sandbox.context.num).to.be.undefined
    })
  })

  describe('#set, #get, #assign, #remove', function() {
    it('should set and get a number literal', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('a', 12345)
      let result = await sandbox.get('a')
      expect(result).to.equal(12345)
    })

    it('should set and get a string literal', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('a', '12345')
      let result = await sandbox.get('a')
      expect(result).to.equal('12345')
    })

    it('should set and get a function', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('sayHello', function() { return 'hello' })
      let fn = await sandbox.get('sayHello')
      expect(fn()).to.equal('hello')
    })

    it('should assign multiple property', async function() {
      let sandbox = new Sandbox()
      await sandbox.assign({
        a: 12345
      , b: 54321
      , c(test) {
          return test
        }
      })
      let a = await sandbox.get('a')
        , b = await sandbox.get('b')
        , c = await sandbox.get('c')
      expect(a).to.equal(12345)
      expect(b).to.equal(54321)
      expect(c(12345)).to.equal(12345)
    })

    it('should remove property', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('a', '12345')
      await sandbox.remove('a')
      let result = await sandbox.get('a')
      expect(result).to.be.undefined
    })
  })

  describe('#call', function() {
    it('should return value', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('a', function(value) {
        return value
      })
      let result = await sandbox.call('a', 12345)
      expect(result).to.equal(12345)
    })
  })

  describe('#destory', function() {
    it('should destory worker', async function() {
      let sandbox = new Sandbox()
      sandbox.destory()
      expect(sandbox._worker).to.be.null
    })

    it('should throw an Error after worker destoried', async function() {
      let sandbox = new Sandbox()
      sandbox.destory()
      try {
        await sandbox.eval('12345')
        expect(false).to.be.true
      } catch(e) {
        expect(e.message).to.equal('No available Worker instance.')
      }
    })
  })

  describe('#addEventListener, #removeEventListener, #dispatchEvent', function() {
    it('should trigger error event', function() {
      let sandbox = new Sandbox()
      sandbox.addEventListener('error', function({ detail }) {
        expect(detail instanceof Error).to.be.true
        expect(detail.message).to.equal('too young to die')
      })
      sandbox.dispatchEvent(new CustomEvent('error', {
        detail: new Error('too young to die')
      }))
    })

    it('should remove the always-fail listenner', function() {
      let sandbox = new Sandbox()
      function alwaysFail() {
        expect(false).to.be.true
      }
      sandbox.addEventListener('error', alwaysFail)
      sandbox.removeEventListener('error', alwaysFail)
      sandbox.dispatchEvent(new CustomEvent('error', {
        detail: new Error('too young to die')
      }))
    })
  })
})
