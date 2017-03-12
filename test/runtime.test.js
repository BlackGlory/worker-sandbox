import { expect } from 'chai'
import { Runtime, TimeoutError } from '../src/runtime'

describe('Runtime', function() {
  describe('#execute', function() {
    it('should always return undefined', async function() {
      let runtime = new Runtime()
        , result = await runtime.execute('12345')
      expect(result).to.be.undefined
    })
  })

  describe('#eval', function() {
    it('should return a literal when code return a literal', async function() {
      let runtime = new Runtime()
        , result = await runtime.eval('12345')
      expect(result).to.equal(12345)
    })

    it('should return a Promise when code return a Promise', async function() {
      let runtime = new Runtime()
        , result = await runtime.eval('Promise.resolve(12345)')
      expect(result).to.equal(12345)
    })

    it('should return a literal when function return a literal', async function() {
      let runtime = new Runtime()
        , result = await runtime.eval(function() {
            return 12345
          })
      expect(result).to.equal(12345)
    })

    it('should throw a TimeoutError when timeout', async function() {
      let runtime = new Runtime()
      runtime.addEventListener('error', console.error)
      try {
        await runtime.eval('new Promise(resolve => setTimeout(resolve, 10000))', 1000)
      } catch(e) {
        expect(e).to.be.a('error')
        expect(e instanceof TimeoutError).to.be.true
      }
    })

    it('should return new value', async function() {
      let runtime = new Runtime()
      await runtime.execute('window.a = "hello world"')
      let result = await runtime.eval('a')
      expect(result).to.equal('hello world')
    })

    it('should throw SyntaxError', async function() {
      let runtime = new Runtime()
      try {
        await runtime.execute('*****')
      } catch(e) {
        expect(e instanceof SyntaxError).to.be.true
      }
    })
  })

  describe('::constructor', function() {
    it('should return context when eval with context', async function() {
      let runtime = new Runtime({
            a: 'hello world'
          })
        , result = await runtime.eval('a')
      expect(result).to.equal('hello world')
    })
  })

  describe('#set, #get, #assign', function() {
    it('should set and get a number literal', async function() {
      let runtime = new Runtime()
      await runtime.set('a', 12345)
      let result = await runtime.get('a')
      expect(result).to.equal(12345)
    })

    it('should set and get a string literal', async function() {
      let runtime = new Runtime()
      await runtime.set('a', '12345')
      let result = await runtime.get('a')
      expect(result).to.equal('12345')
    })

    it('should set and get a function', async function() {
      let runtime = new Runtime()
      await runtime.set('sayHello', function() { return 'hello' })
      let fn = await runtime.get('sayHello')
      expect(fn()).to.equal('hello')
    })

    it('should assign multiple property', async function() {
      let runtime = new Runtime()
      await runtime.assign({
        a: 12345
      , b: 54321
      })
      let a = await runtime.get('a')
        , b = await runtime.get('b')
      expect(a).to.equal(12345)
      expect(b).to.equal(54321)
    })
  })

  describe('#call', function() {
    it('should return value', async function() {
      let runtime = new Runtime({
        a: function(value) {
          return value
        }
      })
      let result = await runtime.call('a', 12345)
      expect(result).to.equal(12345)
    })
  })

  describe('#destory', function() {
    it('should destory worker', async function() {
      let runtime = new Runtime()
      runtime.destory()
      expect(runtime._worker).to.be.null
    })

    it('should throw an Error after worker destoried', async function() {
      let runtime = new Runtime()
      runtime.destory()
      try {
        await runtime.eval('12345')
      } catch(e) {
        expect(e.message).to.equal('No available Worker instance.')
      }
    })
  })

  describe('#addEventListener, #removeEventListener, #dispatchEvent', function() {
    it('should trigger error event', function() {
      let runtime = new Runtime()
      runtime.addEventListener('error', function({ detail }) {
        expect(detail instanceof Error).to.be.true
        expect(detail.message).to.equal('too young to die')
      })
      runtime.dispatchEvent(new CustomEvent('error', {
        detail: new Error('too young to die')
      }))
    })

    it('should remove the always-fail listenner', function() {
      let runtime = new Runtime()
      function alwaysFail() {
        expect(false).to.be.true
      }
      runtime.addEventListener('error', alwaysFail)
      runtime.removeEventListener('error', alwaysFail)
      runtime.dispatchEvent(new CustomEvent('error', {
        detail: new Error('too young to die')
      }))
    })
  })
})
