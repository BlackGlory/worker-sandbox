import * as expect from 'expect'
import { Sandbox } from '../src/sandbox'
import CustomWorker from 'worker-loader?inline&name=custom-worker.js!./custom-worker'

describe('CustomWorker', () => {
  it('should say hello', async () => {
    const sandbox = new Sandbox(new CustomWorker())
    const result = await sandbox.call('sayHello')
    expect(result).toEqual('Hello')
  })

  it('should not say goodbye', async () => {
    const sandbox = new Sandbox(new CustomWorker())
    expect(sandbox.call('sayGoodbye')).rejects.toThrow('TypeError')
  })
})