'use strict'

import { expect } from 'chai'
import Sandbox from '../src/sandbox'
import { TimeoutError } from '../src/sandbox'

describe('Quickstart', function() {
  it('is default case', async function() {
    async function runInContext(code, context) {
      let sandbox = new Sandbox()
      try {
        await sandbox.assign(context)
        return await sandbox.eval(code)
      } finally {
        sandbox.destroy()
      }
    }

    expect(await runInContext('sayHelloWorld()', {
      helloWorld: 'hello world'
    , sayHelloWorld() {
        return helloWorld
      }
    })).to.equal('hello world')
  })
})

describe('API', function() {
  describe('class Sandbox()', function() {
    it('is default case', function() {
      let sandbox = new Sandbox()
      expect(sandbox instanceof Sandbox).to.be.true
    })
  })

  describe('Sandbox#eval', function() {
    it('is default case', async function() {
      let sandbox = new Sandbox()
        , result = await sandbox.eval('"hello world"')
      expect(result === 'hello world').to.be.true
    })

    it('is timeout case', async function() {
      let sandbox = new Sandbox()
      try {
        await sandbox.eval('while(true) {}', 1000)
        expect(false).to.be.true
      } catch(e) {
        expect(e instanceof TimeoutError).to.be.true
      }
    })
  })

  describe('Sandbox#execute', function() {
    it('is default case', async function() {
      let sandbox = new Sandbox()
        , result = await sandbox.execute('"hello world"')
      expect(result === undefined).to.be.true
    })
  })

  describe('Sandbox#context', function() {
    it('is default case', async function() {
      let sandbox = new Sandbox()

      // read context
      await sandbox.context // {}

      // set context value
      sandbox.context.helloWorld = 'hello world'

      // get context value
      expect(await sandbox.context.helloWorld === 'hello world').to.be.true

      // set context function
      sandbox.context.sayHelloWorld = function(speaker) {
        return `${ speaker }: ${ helloWorld }`
      }

      // call context function(call in worker)
      expect(await sandbox.context.sayHelloWorld('Sandbox') === 'Sandbox: hello world').to.be.true

      // remove context value
      delete sandbox.context.helloWorld
      delete sandbox.context.sayHelloWorld
      expect(await sandbox.context.helloWorld === undefined).to.be.true
      expect(await sandbox.context.sayHelloWorld === undefined).to.be.true
    })
  })

  describe('Sandbox#set', function() {
    it('is string case', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('arr', [])
      await sandbox.set('arr[0]', 'hello')
      await sandbox.set('arr[1]', 'world')
      await sandbox.set(['arr[2]'], 'arr[2]')
      expect((await sandbox.context.arr).join(' ') === 'hello world').to.be.true
      expect(await sandbox.context['arr[2]'] === 'arr[2]').to.be.true
    })

    it('is array case', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('arr', [])
      await sandbox.set(['arr', '0'], 'hello')
      await sandbox.set(['arr', '1'], 'world')
      await sandbox.set(['arr[2]'], 'arr[2]')
      expect((await sandbox.context.arr).join(' ') === 'hello world').to.be.true
      expect(await sandbox.context['arr[2]'] === 'arr[2]').to.be.true
    })

    it('is syntax surge case', async function() {
      let sandbox = new Sandbox()
      sandbox.context.arr = []
      sandbox.context.arr[0] = 'hello'
      sandbox.context.arr[1] = 'world'
      sandbox.context['arr[2]'] = 'arr[2]'
      expect((await sandbox.context.arr).join(' ') === 'hello world').to.be.true
      expect(await sandbox.context['arr[2]'] === 'arr[2]').to.be.true
    })
  })

  describe('Sandbox#assign', function() {
    it('is default case', async function() {
      let sandbox = new Sandbox()
      await sandbox.assign({
        hello: 'hello'
      , world: 'world'
      , sayHelloWorld() {
          return `${ hello } ${ world}`
        }
      , 'functions.sayHelloWorld': function() {
          return `${ hello } ${ world}`
        }
      })
      expect(await sandbox.context.sayHelloWorld() === 'hello world').to.be.true
      expect(await sandbox.context['functions.sayHelloWorld']() === 'hello world').to.be.true
    })

    it('is syntax surge', async function() {
      let sandbox = new Sandbox()
      Object.assign(sandbox.context, {
        hello: 'hello'
      , world: 'world'
      , sayHelloWorld() {
          return `${ hello } ${ world}`
        }
      , 'functions.sayHelloWorld': function() {
          return `${ hello } ${ world}`
        }
      })
      expect(await sandbox.context.sayHelloWorld() === 'hello world').to.be.true
      expect(await sandbox.context['functions.sayHelloWorld']() === 'hello world').to.be.true
    })
  })

  describe('Sandbox#get', function() {
    it('is string case', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      expect(await sandbox.get('obj.hello') === 'hello').to.be.true
      expect(await sandbox.get('obj["world"]') === 'world').to.be.true
    })

    it('is array case', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      expect(await sandbox.get(['obj', 'hello']) === 'hello').to.be.true
      expect(await sandbox.get(['obj', 'world']) === 'world').to.be.true
    })

    it('is syntax surge case', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      expect(await sandbox.context.obj.hello === 'hello').to.be.true
      expect(await sandbox.context.obj['world'] === 'world').to.be.true
    })
  })

  describe('Sandbox#remove', function() {
    it('is string case', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      await sandbox.remove('obj.hello')
      await sandbox.remove('obj["world"]')
      expect(await sandbox.context.obj).to.deep.equal({})
    })

    it('is array case', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      await sandbox.remove(['obj', 'hello'])
      await sandbox.remove(['obj', 'world'])
      expect(await sandbox.context.obj).to.deep.equal({})
    })

    it('is syntax surge case', async function() {
      let sandbox = new Sandbox()
      await sandbox.set('obj', {
        hello: 'hello'
      , world: 'world'
      })
      delete sandbox.context.obj.hello
      delete sandbox.context.obj.world
      expect(await sandbox.context.obj).to.deep.equal({})
    })
  })

  describe('Sandbox#call', function() {
    it('is string case', async function() {
      let sandbox = new Sandbox()
      sandbox.context.helloWorld = 'hello world'
      sandbox.context.functions = {}
      sandbox.context.functions.sayHelloWorld = function(speaker) {
        return `${ speaker }: ${ helloWorld }`
      }
      expect(await sandbox.call('functions.sayHelloWorld', 'Sandbox') === 'Sandbox: hello world').to.be.true
    })

    it('is array case', async function() {
      let sandbox = new Sandbox()
      sandbox.context.helloWorld = 'hello world'
      sandbox.context.functions = {}
      sandbox.context.functions.sayHelloWorld = function(speaker) {
        return `${ speaker }: ${ helloWorld }`
      }
      expect(await sandbox.call(['functions', 'sayHelloWorld'], 'Sandbox') === 'Sandbox: hello world').to.be.true
    })

    it('is syntax surge', async function() {
      let sandbox = new Sandbox()
      sandbox.context.helloWorld = 'hello world'
      sandbox.context.functions = {}
      sandbox.context.functions.sayHelloWorld = function(speaker) {
        return `${ speaker }: ${ helloWorld }`
      }
      expect(await sandbox.context.functions.sayHelloWorld('Sandbox') === 'Sandbox: hello world').to.be.true
    })
  })

  describe('Sandbox#callable', function() {
    it('is default case', async function() {
      let sandbox = new Sandbox()
        , helloWorld = 'hello world'

      // set callable function
      sandbox.callable.sayHelloWorld = function(speaker) {
        return `${ speaker }: ${ helloWorld }`
      }

      // call callable function(call in worker)
      expect(await sandbox.eval('sayHelloWorld("Sandbox")') === 'Sandbox: hello world').to.be.true

      // remove callable function
      delete sandbox.callable.sayHelloWorld
      try {
        await sandbox.eval('sayHelloWorld')
        expect(false).to.be.true
      } catch(e) {
        expect(e instanceof ReferenceError).to.be.true
      }
    })
  })

  describe('Sandbox#registerCall', async function() {
    let sandbox = new Sandbox()
      , helloWorld = 'hello world'
    await sandbox.registerCall('sayHelloWorld', function(speaker) {
      return `${ speaker }: ${ helloWorld }`
    })
    expect(await sandbox.eval('sayHelloWorld("Sandbox")') === 'Sandbox: hello world').to.be.true
  })

  describe('Sandbox#cancelCall', async function() {
    let sandbox = new Sandbox()
      , helloWorld = 'hello world'
    await sandbox.registerCall('sayHelloWorld', function(speaker) {
      return `${ speaker }: ${ helloWorld }`
    })
    await sandbox.cancelCall('sayHelloWorld')
    try {
      await sandbox.eval('sayHelloWorld')
      expect(false).to.be.true
    } catch(e) {
      expect(e instanceof ReferenceError).to.be.true
    }
  })

  describe('Sandbox#available', function() {
    it('is default case', function() {
      let sandbox = new Sandbox()
      expect(sandbox.available).to.be.true
    })
  })

  describe('Sandbox#destroy', function() {
    it('is default case', function() {
      let sandbox = new Sandbox()
      expect(sandbox.available).to.be.true
      expect(sandbox.destroy()).to.be.true
      expect(sandbox.available).to.be.false
      expect(sandbox.destroy()).to.be.false
      expect(sandbox.available).to.be.false
    })
  })

  describe('class TimeoutError', function() {
    it('is default case', function() {
      let err = new TimeoutError('You overtime!')
      expect(err instanceof TimeoutError).to.be.true
      expect(err.message).to.equal('You overtime!')
    })
  })
})

describe('Tricks', function() {
  it('without await operator', async function() {
    let sandbox = new Sandbox()
    for (let i = 1000; i--;) {
      sandbox.set('hello', 'hello')
      sandbox.assign({
        world: 'world'
      , removable: 'removable'
      })
      sandbox.remove('removable')
    }
    expect(await sandbox.context.removable === undefined).to.be.true
    expect(await sandbox.context.hello === 'hello').to.be.true
    expect(await sandbox.context.world === 'world').to.be.true
  })
})
