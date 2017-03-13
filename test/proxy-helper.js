import { expect } from 'chai'
import { createAsyncProxy } from '../src/proxy-helper'

describe('Proxy', function() {
  describe('createAsyncProxy', function() {
    it('should create a accessible proxy', async function() {
      const example = {
        fn(test) {
          return test
        }
      , async asyncFn(test) {
          return test
        }
      , num: 12345
      , obj: {
          fn(test) {
            return test
          }
        }
      }

      let pp = createAsyncNestedProxy(async function(path) {
        return path.reduce((res, cur) => res[cur], example)
      })

      expect(await pp).to.deep.equal(example)
      expect((await pp.fn)(1)).to.equal(example.fn(1))
      expect(await pp.fn(2)).to.equal(example.fn(2))
      expect(await (await pp.asyncFn)(3)).to.equal(await example.asyncFn(3))
      expect(await pp.asyncFn(4)).to.equal(await example.asyncFn(4))
      expect(await pp.obj).to.deep.equal(example.obj)
      expect((await pp.obj.fn)(5)).to.equal(example.fn(5))
      expect(await pp.obj.fn(6)).to.equal(example.fn(6))
    })
  })
})
