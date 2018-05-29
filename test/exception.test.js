import * as expect from 'expect'
import { Sandbox } from '../src/sandbox'

describe('Execption', function() {
  it('should throw an Error when eval throw error', async () => {
    const sandbox = new Sandbox()
    expect(sandbox.eval('throw new Error("just a joke")')).rejects.toThrow(Error, 'just a joke')
  })

  it('should assign to context by eval', async () => {
    const sandbox = new Sandbox()
    await sandbox.set('a', 12345)
    await sandbox.eval('a = 54321')
    expect(await sandbox.get('a')).toEqual(54321)
  })

  it('should assign to context by call', async () => {
    const sandbox = new Sandbox()
    await sandbox.set('a', 12345)
    expect(await sandbox.get('a')).toEqual(12345)
    await sandbox.set('b', function() {
      a = 54321
    })
    await sandbox.call('b')
    expect(await sandbox.get('a')).toEqual(54321)
    await sandbox.set('c', function() {
      a = 12345
    })
    await sandbox.eval('c()')
    expect(await sandbox.get('a')).toEqual(12345)
  })

  it('should undefined to be undefined', async () => {
    const sandbox = new Sandbox()
    await sandbox.set('a', undefined)
    expect(await sandbox.eval('a')).toBeUndefined()
  })

  it('should allows declaration of variables', async () => {
    const sandbox = new Sandbox()
    await sandbox.set('a', 12345)
    expect(await sandbox.eval(`
      let a = 54321
      a
    `)).toEqual(54321)
  })
})
