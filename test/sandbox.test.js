import { expect } from 'chai'
import { Sandbox, TimeoutError } from '../src/sandbox'

describe('Sandbox', function() {
  describe('#save', async function() {
    let sandbox = new Sandbox()
    await sandbox.save()
  })

  describe('#restore', async function() {
    let sandbox = new Sandbox()
    await sandbox.restore()
  })

  describe('#clone', async function() {
    let sandbox = new Sandbox()
    await sandbox.clone()
  })

  describe('#clear', async function() {
    let sandbox = new Sandbox()
    await sandbox.clear()
  })
})
