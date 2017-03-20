import { expect } from 'chai'
import {
  runInContext
, callInContext
} from '../src/run-in-context'

describe('runInContext', function() {
  it('should run in context', function() {
    let result = runInContext('b(a)', {
      a: 12345
    , b(value) {
        return value
      }
    })
    expect(result).to.equal(12345)
  })

  it('should blocked internal environment', function() {
    expect(runInContext('code')).to.be.undefined
    expect(runInContext(`
      let code = 12345
      code
    `)).to.equal(12345)
    expect(runInContext('values')).to.be.undefined
    expect(runInContext(`
      let values = 12345
      values
    `)).to.equal(12345)
  })

  it('should throw TypeError when first argument isnt String', function() {
    expect(() => runInContext(() => {}, {})).to.throw(TypeError)
  })

  it('should throw TypeError when first argument istn Function', function() {
    expect(() => callInContext('')).to.throw(TypeError)
  })
})
