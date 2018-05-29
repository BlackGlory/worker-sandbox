import * as expect from 'expect'
import { Sandbox } from '../src/sandbox'

describe('Sandbox', () => {
  describe('#execute', () => {
    it('should always return undefined', async () => {
      const sandbox = new Sandbox()
      const result = await sandbox.execute('12345')
      expect(result).toBeUndefined()
    })
  })

  describe('#eval', () => {
    it('should return a literal when code return a literal', async () => {
      const sandbox = new Sandbox()
      const result = await sandbox.eval('12345')
      expect(result).toEqual(12345)
    })

    it('should return a Promise when code return a Promise', async () => {
      const sandbox = new Sandbox()
      const result = await sandbox.eval('Promise.resolve(12345)')
      expect(result).toEqual(12345)
    })

    it('should return new value', async () => {
      const sandbox = new Sandbox()
      await sandbox.execute('self.a = "hello world"')
      const result = await sandbox.eval('a')
      expect(result).toEqual('hello world')
    })
  })

  describe('#registerCall, #cancelCall', () => {
    it('should register a callable function', async () => {
      const x = 'HelloWorld'
      let sandbox = new Sandbox()
      await sandbox.registerCall(['sayX'], function() {
        return x
      })
      expect(await sandbox.eval('sayX()')).toEqual(x)
    })

    it('should cancel a callable function', async () => {
      const a = 'GoodbyeWorld'
      const sandbox = new Sandbox()
      await sandbox.registerCall(['sayGoodbyeWorld'], function() {
        return a
      })
      await sandbox.cancelCall(['sayGoodbyeWorld'])
      expect(sandbox.eval('sayGoodbyeWorld()')).rejects.toThrow(ReferenceError)
    })
  })

  describe('#context, #callable', () => {
    it('should context accesible', async () => {
      const sandbox = new Sandbox()
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
      expect(await sandbox.context.a).toEqual(12345)
      expect((await sandbox.context.b)()).toEqual(12345)
      expect(await sandbox.context.b()).toEqual(12345)
      expect(await sandbox.context.c.a).toEqual(12345)
      expect((await sandbox.context.c.b)()).toEqual(12345)
      expect(await sandbox.context.c.b()).toEqual(12345)
    })

    it('should callable get, set, delete', async () => {
      const sandbox = new Sandbox()
      expect(() => sandbox.callable.num = 12345).toThrow(TypeError)
      sandbox.callable.fn = () => 12345
      expect(await sandbox.callable.fn()).toEqual(12345)
      delete sandbox.callable.fn
      expect(await sandbox.callable.fn).toBeUndefined()
    })

    it('should context call callable', async () => {
      // BUG
      const sandbox = new Sandbox()
      sandbox.callable.sayMorning = function() {
        return 'Morning'
      }
      sandbox.context.wantSayMorning = function() {
        return sayMorning()
      }
      expect(await sandbox.eval('wantSayMorning()')).toEqual('Morning')
    })
  })

  describe('#context', () => {
    it('should get, set, delete', async () => {
      const sandbox = new Sandbox()
      sandbox.context.num = 12345
      expect(await sandbox.context.num).toEqual(12345)
      delete sandbox.context.num
      expect(await sandbox.context.num).toBeUndefined()
    })
  })

  describe('#set, #get, #assign, #remove', () => {
    it('should set and get a number literal', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('a', 12345)
      const result = await sandbox.get('a')
      expect(result).toEqual(12345)
    })

    it('should set and get a string literal', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('a', '12345')
      const result = await sandbox.get('a')
      expect(result).toEqual('12345')
    })

    it('should set and get a function', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('sayHello', () => 'hello')
      const fn = await sandbox.get('sayHello')
      expect(fn()).toEqual('hello')
    })

    it('should assign multiple property', async () => {
      const sandbox = new Sandbox()
      await sandbox.assign({
        a: 12345
      , b: 54321
      , c(test) {
          return test
        }
      , async d(test) {
          return test
        }
      })
      const a = await sandbox.get('a')
      const b = await sandbox.get('b')
      const c = await sandbox.get('c')
      const d = await sandbox.get('d')
      expect(a).toEqual(12345)
      expect(b).toEqual(54321)
      expect(c(12345)).toEqual(12345)
      expect(await d(54321)).toEqual(54321)
    })

    it('should remove property', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('a', '12345')
      await sandbox.remove('a')
      const result = await sandbox.get('a')
      expect(result).toBeUndefined()
    })
  })

  describe('#call', () => {
    it('should return value', async function() {
      const sandbox = new Sandbox()
      await sandbox.set('a', value => value)
      const result = await sandbox.call('a', 12345)
      expect(result).toEqual(12345)
    })
  })
})
