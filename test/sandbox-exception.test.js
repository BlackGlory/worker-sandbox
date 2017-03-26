'use strict'

import { expect } from 'chai'
import { Sandbox, TimeoutError } from '../src/sandbox'
import initJSONHelper from '../src/json-helper'

const { stringify } = initJSONHelper({})

describe('Sandbox Execption', function() {
  it('should throw a TimeoutError and worker destroyed', async function() {
    let sandbox = new Sandbox()
    try {
      await sandbox.eval('new Promise(resolve => setTimeout(resolve, 10000))', 1000)
      expect(false).to.be.true
    } catch(e) {
      expect(e instanceof TimeoutError).to.be.true
      expect(sandbox.available).to.be.false
    }
  })

  it('should throw a SyntaxError when eval wrong syntax', async function() {
    let sandbox = new Sandbox()
    try {
      await sandbox.eval('*****', 1000)
      expect(false).to.be.true
    } catch(e) {
      expect(e instanceof SyntaxError).to.be.true
      expect(sandbox.available).to.be.true
    }
  })

  it('should throw a Error when eval throw error', async function() {
    let sandbox = new Sandbox()
    try {
      await sandbox.eval('throw new Error("just a joke")')
      expect(false).to.be.true
    } catch(e) {
      expect(e.message).to.equal('just a joke')
      expect(sandbox.available).to.be.true
    }
  })

  it('should throw an Error after worker destoried', async function() {
    let sandbox = new Sandbox()
    expect(sandbox.destroy()).to.be.true
    expect(sandbox.available).to.be.false
    try {
      await sandbox.eval('12345')
      expect(false).to.be.true
    } catch(e) {
      expect(e.message).to.equal('No available Worker instance.')
      expect(sandbox.available).to.be.false
    }
  })

  it('should dispatch unhandled error', function(done) {
    let sandbox = new Sandbox()
    sandbox.addEventListener('error', function({ detail }) {
      done()
    })
    sandbox.eval('setTimeout(() => { throw new Error("a unhandled error") }, 0)')
  })

  it('should assign to context by eval', async function() {
    let sandbox = new Sandbox()
    await sandbox.set('a', 12345)
    await sandbox.eval('a = 54321')
    expect(await sandbox.get('a')).to.equal(54321)
  })

  it('should undefined to be undefined', async function() {
    let sandbox = new Sandbox()
    await sandbox.set('a', undefined)
    expect(await sandbox.eval('a')).to.be.undefined
  })

  it('should allows declaration of variables', async function() {
    let sandbox = new Sandbox()
    await sandbox.set('a', 12345)
    expect(await sandbox.eval(`
      let a = 54321
      a
    `)).to.equal(54321)
  })

  // TODO: not now
  /*
  it('should dispatch unhandled rejection', async function() {
    let sandbox = new Sandbox()
    sandbox.addEventListener('error', evt => {

    })
    await sandbox.eval('void new Promise((resolve, reject) => reject("a unhandled rejection"))')
  })
  */
})
