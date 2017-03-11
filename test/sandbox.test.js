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
      sandbox.addEventListener('error', console.error)
      try {
        await sandbox.eval('new Promise(resolve => setTimeout(resolve, 10000))', 1000)
      } catch(e) {
        expect(e).to.be.a('error')
        expect(e instanceof TimeoutError).to.be.true
      }
    })

    it('should return new value', async function() {
      let sandbox = new Sandbox()
      await sandbox.execute('window.a = "hello world"')
      let result = await sandbox.eval('a')
      expect(result).to.equal('hello world')
    })
  })

  describe('::constructor', function() {
    it('should return context when eval with context', async function() {
      let sandbox = new Sandbox({
            a: 'hello world'
          })
        , result = await sandbox.eval('a')
      expect(result).to.equal('hello world')
    })
  })

  describe('#set, #get, #assign', function() {
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
      })
      let a = await sandbox.get('a')
        , b = await sandbox.get('b')
      expect(a).to.equal(12345)
      expect(b).to.equal(54321)
    })
  })

  describe('#call', function() {
    it('should return value', async function() {
      let sandbox = new Sandbox({
        a: function(value) {
          return value
        }
      })
      let result = await sandbox.call('a', 12345)
      expect(result).to.equal(12345)
    })
  })

  describe('#destory', function() {
    it('should destory worker', async function() {
      let sandbox = new Sandbox()
      sandbox.destory()
      expect(sandbox.worker).to.be.null
    })
  })
})
