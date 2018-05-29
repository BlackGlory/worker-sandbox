import expect from 'expect'
import { Sandbox } from '../src/sandbox'

describe('API', () => {
  describe('class Sandbox()', () => {
    it('is default case', () => {
      const sandbox = new Sandbox()
      expect(sandbox instanceof Sandbox).toBeTruthy()
    })
  })

  describe('Sandbox#eval', () => {
    it('is default case', async () => {
      const sandbox = new Sandbox()
      const result = await sandbox.eval('"hello world"')
      expect(result).toEqual('hello world')
    })
  })

  describe('Sandbox#execute', () => {
    it('is default case', async () => {
      const sandbox = new Sandbox()
      const result = await sandbox.execute('"hello world"')
      expect(result).toBeUndefined()
    })
  })

  describe('Sandbox#context', () => {
    it('is default case', async () => {
      const sandbox = new Sandbox()

      // read context
      await sandbox.context // {}

      // set context value
      sandbox.context.helloWorld = 'hello world'

      // get context value
      expect(await sandbox.context.helloWorld).toEqual('hello world')

      // set context function
      sandbox.context.sayHelloWorld = speaker =>
        `${ speaker }: ${ helloWorld }`

      // call context function(call in worker)
      expect(await sandbox.context.sayHelloWorld('Sandbox')).toEqual('Sandbox: hello world')

      // remove context value
      delete sandbox.context.helloWorld
      delete sandbox.context.sayHelloWorld
      expect(await sandbox.context.helloWorld).toBeUndefined()
      expect(await sandbox.context.sayHelloWorld).toBeUndefined()
    })
  })

  describe('Sandbox#set', () => {
    it('is string case', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('arr', [])
      await sandbox.set('arr[0]', 'hello')
      await sandbox.set('arr[1]', 'world')
      await sandbox.set(['arr[2]'], 'arr[2]')
      expect((await sandbox.context.arr).join(' ')).toEqual('hello world')
      expect(await sandbox.context['arr[2]']).toEqual('arr[2]')
    })

    it('is array case', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('arr', [])
      await sandbox.set(['arr', '0'], 'hello')
      await sandbox.set(['arr', '1'], 'world')
      await sandbox.set(['arr[2]'], 'arr[2]')
      expect((await sandbox.context.arr).join(' ')).toEqual('hello world')
      expect(await sandbox.context['arr[2]']).toEqual('arr[2]')
    })

    it('is syntax surge case', async () => {
      const sandbox = new Sandbox()
      sandbox.context.arr = []
      sandbox.context.arr[0] = 'hello'
      sandbox.context.arr[1] = 'world'
      sandbox.context['arr[2]'] = 'arr[2]'
      expect((await sandbox.context.arr).join(' ')).toEqual('hello world')
      expect(await sandbox.context['arr[2]']).toEqual('arr[2]')
    })
  })

  describe('Sandbox#assign', () => {
    it('is default case', async () => {
      const sandbox = new Sandbox()
      await sandbox.assign({
        hello: 'hello'
      , world: 'world'
      , sayHelloWorld() {
          return `${ hello } ${ world}`
        }
      , ['functions.sayHelloWorld']() {
          return `${ hello } ${ world}`
        }
      })
      expect(await sandbox.context.sayHelloWorld()).toEqual('hello world')
      expect(await sandbox.context['functions.sayHelloWorld']()).toEqual('hello world')
    })

    it('is syntax surge', async () => {
      const sandbox = new Sandbox()
      Object.assign(sandbox.context, {
        hello: 'hello'
      , world: 'world'
      , sayHelloWorld() {
          return `${ hello } ${ world}`
        }
      , ['functions.sayHelloWorld']() {
          return `${ hello } ${ world}`
        }
      })
      expect(await sandbox.context.sayHelloWorld()).toEqual('hello world')
      expect(await sandbox.context['functions.sayHelloWorld']()).toEqual('hello world')
    })
  })

  describe('Sandbox#get', () => {
    it('is string case', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      expect(await sandbox.get('obj.hello')).toEqual('hello')
      expect(await sandbox.get('obj["world"]')).toEqual('world')
    })

    it('is array case', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      expect(await sandbox.get(['obj', 'hello'])).toEqual('hello')
      expect(await sandbox.get(['obj', 'world'])).toEqual('world')
    })

    it('is syntax surge case', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      expect(await sandbox.context.obj.hello).toEqual('hello')
      expect(await sandbox.context.obj['world']).toEqual('world')
    })
  })

  describe('Sandbox#remove', () => {
    it('is string case', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      await sandbox.remove('obj.hello')
      await sandbox.remove('obj["world"]')
      expect(await sandbox.context.obj).toEqual({})
    })

    it('is array case', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      await sandbox.remove(['obj', 'hello'])
      await sandbox.remove(['obj', 'world'])
      expect(await sandbox.context.obj).toEqual({})
    })

    it('is syntax surge case', async () => {
      const sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      delete sandbox.context.obj.hello
      delete sandbox.context.obj.world
      expect(await sandbox.context.obj).toEqual({})
    })
  })

  describe('Sandbox#call', () => {
    it('is string case', async () => {
      const sandbox = new Sandbox()
      sandbox.context.helloWorld = 'hello world'
      sandbox.context.functions = {}
      sandbox.context.functions.sayHelloWorld = speaker => `${ speaker }: ${ helloWorld }`
      expect(await sandbox.call('functions.sayHelloWorld', 'Sandbox')).toEqual('Sandbox: hello world')
    })

    it('is array case', async () => {
      const sandbox = new Sandbox()
      sandbox.context.helloWorld = 'hello world'
      sandbox.context.functions = {}
      sandbox.context.functions.sayHelloWorld = speaker => `${ speaker }: ${ helloWorld }`
      expect(await sandbox.call(['functions', 'sayHelloWorld'], 'Sandbox')).toEqual('Sandbox: hello world')
    })

    it('is syntax surge', async () => {
      const sandbox = new Sandbox()
      sandbox.context.helloWorld = 'hello world'
      sandbox.context.functions = {}
      sandbox.context.functions.sayHelloWorld = speaker => `${ speaker }: ${ helloWorld }`
      expect(await sandbox.context.functions.sayHelloWorld('Sandbox')).toEqual('Sandbox: hello world')
    })
  })

  describe('Sandbox#callable', () => {
    it('is default case', async () => {
      const sandbox = new Sandbox()
      const helloWorld = 'hello world'

      // set callable function
      sandbox.callable.sayHelloWorld = speaker => `${ speaker }: ${ helloWorld }`

      // call callable function(call in worker)
      expect(await sandbox.eval('sayHelloWorld("Sandbox")')).toEqual('Sandbox: hello world')

      // remove callable function
      delete sandbox.callable.sayHelloWorld
      expect(sandbox.eval('sayHelloWorld')).rejects.toThrow(ReferenceError)
    })
  })

  describe('Sandbox#registerCall', () => {
    it('is default case', async () => {
      const sandbox = new Sandbox()
      const helloWorld = 'hello world'
      await sandbox.registerCall('sayHelloWorld', speaker => `${ speaker }: ${ helloWorld }`)
      expect(await sandbox.eval('sayHelloWorld("Sandbox")')).toEqual('Sandbox: hello world')
    })
  })

  describe('Sandbox#cancelCall', () => {
    it('is default case', async () => {
      const sandbox = new Sandbox()
      const helloWorld = 'hello world'
      await sandbox.registerCall('sayHelloWorld', speaker => `${ speaker }: ${ helloWorld }`)
      await sandbox.cancelCall('sayHelloWorld')
      expect(sandbox.eval('sayHelloWorld')).rejects.toThrow(ReferenceError)
    })
  })

  describe('Sandbox#destroy', () => {
    it('is default case', async () => {
      const sandbox = new Sandbox()
      sandbox.destroy()
    })
  })
})

describe('Tips', () => {
  it('without await operator', async () => {
    const sandbox = new Sandbox()
    for (let i = 1000; i--;) {
      sandbox.set('hello', 'hello')
      sandbox.assign({
        world: 'world'
      , removable: 'removable'
      })
      sandbox.remove('removable')
    }
    expect(await sandbox.context.removable).toBeUndefined()
    expect(await sandbox.context.hello).toEqual('hello')
    expect(await sandbox.context.world).toEqual('world')
  })
})
