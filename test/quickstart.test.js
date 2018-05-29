import * as expect from 'expect'
import { Sandbox } from '../src/sandbox'

describe('Quickstart', () => {
  it('is default case', async () => {
    async function runInContext(code, context) {
      const sandbox = new Sandbox()
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
    })).toEqual('hello world')
  })
})
