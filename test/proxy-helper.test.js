import { expect } from 'chai'
import {
  createAsyncProxyHub
, getPropertyByPath
, setPropertyByPath
, deletePropertyByPath
, convertPathListToString
} from '../src/proxy-helper'

describe('Proxy', function() {
  describe('createAsyncProxyHub ', function() {
    it('should get, set, apply, delete property by defaultHandler', async function() {
      const example = {
        fn(test) {
          return test
        }
      , obj: {
          fn(test) {
            return test
          }
        }
      }

      let pp = createAsyncProxyHub(example)
      expect(await pp).to.deep.equal(example)
      expect(await pp.fn(1)).to.equal(example.fn(1))
      expect(await pp.obj).to.deep.equal(example.obj)
      expect(await pp.obj.fn(2)).to.equal(example.obj.fn(2))
      pp.num = 12345
      expect(await pp.num).to.equal(12345)
      delete pp.num
      expect(await pp.num).to.equal(undefined)
    })

    it('should throw Error when get handler throw Error', async function() {
      let pp = createAsyncProxyHub({}, {
        get() {
          throw new Error('just an error')
        }
      })
      try {
        await pp
        expect(false).to.be.true
      } catch(e) {
        expect(e.message).to.equal('just an error')
      }
    })

    it('should get property', async function() {
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

      let pp = createAsyncProxyHub(example, {
        async get(target, path) {
          return getPropertyByPath(target, convertPathListToString(path))
        }
      })

      expect(await pp).to.deep.equal(example)
      expect((await pp.fn)(1)).to.equal(example.fn(1))
      expect(await (await pp.asyncFn)(2)).to.equal(await example.asyncFn(2))
      expect(await pp.num).to.equal(example.num)
      expect(await pp.obj).to.deep.equal(example.obj)
      expect((await pp.obj.fn)(3)).to.equal(example.fn(3))
    })

    it('should apply function', async function() {
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

      let pp = createAsyncProxyHub(example, {
        async apply(target, path, caller, args) {
          return getPropertyByPath(target, convertPathListToString(path)).apply(caller, args)
        }
      })

      expect(await pp.fn(1)).to.equal(example.fn(1))
      expect(await pp.asyncFn(2)).to.equal(await example.asyncFn(2))
      expect(await pp.obj.fn(3)).to.equal(example.fn(3))
    })

    it('should assign property', async function() {
      const example = {}

      let pp = createAsyncProxyHub(example, {
        async set(target, path, value) {
          return setPropertyByPath(target, convertPathListToString(path), value)
        }
      })

      pp.num = 12345

      expect(await pp.num).to.equal(12345)
    })

    it('should remove peoperty', async function() {
      const example = {
        num: 12345
      }

      let pp = createAsyncProxyHub(example, {
        async deleteProperty(target, path) {
          return deletePropertyByPath(target, convertPathListToString(path))
        }
      })

      delete pp.num

      expect(await pp.num).to.equal(undefined)
    })
  })
})

describe('PropertyByPath', function() {
  describe('getPropertyByPath', function() {
    it('should get property by path', function() {
      let obj = {
        a: {
          b: 'b'
        }
      , 'a.b': 'a.b'
      , 'a["b"]': 'a["b"]'
      }
      expect(getPropertyByPath(obj, '')).to.deep.equal(obj)
      expect(getPropertyByPath(obj, 'a')).to.deep.equal(obj.a)
      expect(getPropertyByPath(obj, 'a.b')).to.equal(obj.a.b)
      expect(getPropertyByPath(obj, `["a.b"]`)).to.equal(obj['a.b'])
      expect(getPropertyByPath(obj, `['a.b']`)).to.equal(obj['a.b'])
      expect(getPropertyByPath(obj, '[`a.b`]')).to.equal(obj['a.b'])
      expect(getPropertyByPath(obj, `['a["b"]']`)).to.equal(obj['a["b"]'])
      expect(function() {
        getPropertyByPath(obj, 'a.c.b')
      }).to.throw(TypeError)
    })
  })

  describe('setPropertyByPath', function() {
    it('should set property by path', function() {
      let obj = {}
      expect(function() {
        setPropertyByPath(obj, '', {})
      }).to.throw(Error)
      setPropertyByPath(obj, 'a', {})
      setPropertyByPath(obj, 'a.b', 'b')
      setPropertyByPath(obj, `["a.b"]`, 'a.b')
      setPropertyByPath(obj, `['a["b"]']`, 'a["b"]')
      expect(getPropertyByPath(obj, 'a')).to.deep.equal({ b: 'b' })
      expect(getPropertyByPath(obj, 'a.b')).to.equal('b')
      expect(getPropertyByPath(obj, `["a.b"]`)).to.equal('a.b')
      expect(getPropertyByPath(obj, `['a["b"]']`)).to.equal(obj['a["b"]'])
      expect(function() {
        setPropertyByPath(obj, 'a.c.b')
      }).to.throw(TypeError)
    })
  })

  describe('deletePropertyByPath', function() {
    it('should delete property by path', function() {
      let obj = {
        a: {
          b: 'b'
        }
      , 'a.b': 'a.b'
      , 'a["b"]': 'a["b"]'
      }
      expect(function() {
        deletePropertyByPath(obj, '')
      }).to.throw(Error)
      expect(function() {
        deletePropertyByPath(obj, 'a.c.b')
      }).to.throw(TypeError)
      deletePropertyByPath(obj, 'a.b')
      expect(obj.a).to.deep.equal({})
      deletePropertyByPath(obj, "['a']")
      expect(obj.a).to.be.undefined
      deletePropertyByPath(obj, `['a.b']`)
      expect(obj['a.b']).to.be.undefined
      deletePropertyByPath(obj, `['a["b"]']`)
      expect(obj['a["b"]']).to.be.undefined
    })
  })
})
