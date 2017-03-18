import { expect } from 'chai'
import runInContext from '../src/run-in-context'

describe('runInContext', function() {
  it('run', function() {
    let result = runInContext('b(a)', {
      a: 12345
    , b(value) {
        return value
      }
    })
    expect(result).to.equal(12345)
  })

  it('block', function() {
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
})
