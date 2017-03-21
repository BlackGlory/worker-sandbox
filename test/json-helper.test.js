'use strict'

import { expect } from 'chai'
import initJSONHelper from '../src/json-helper'
import _ from 'lodash'

let { wrap, unwrap, stringify, parse, replacer, reviver } = initJSONHelper({})

describe('JSON', function() {
  describe('stringify & parse', function() {
    it('should return undefined when parse non-string', function() {
      expect(parse(12345)).to.be.undefined
    })

    it('should wrap unknown-type to null', function() {
      expect(wrap(undefined), null)
    })

    it('should unwrap unknown-type to null', function() {
      expect(unwrap({}), null)
    })

    it('should stringify & parse Function', function() {
      let test = () => 12345
        , result = parse(stringify(test))
      expect(_.isFunction(result)).to.be.true
      expect(result()).to.equal(test())
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('should stringify & parse Native Function', function() {
      let test = JSON.stringify
        , result = parse(stringify(test))
      expect(result).to.be.null
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('should stringify & parse Generator', function() {
      let test = {
            * func() {
                yield 12345
              }
          }
        , result = parse(stringify(test.func))
      expect(_.isFunction(result)).to.be.true
      expect([...result()]).to.deep.equal([...test.func()])
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('should stringify & parse Error', function() {
      let test = new Error('12345')
        , result = parse(stringify(test))
      expect(_.isError(test)).to.be.true
      expect(result.message).to.equal('12345')
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('should stringify & parse sub-class of Error', function() {
      class JokeError extends Error {
        constructor(...args) {
          super(...args)
          this.name = 'JokeError'
        }
      }
      let test = new JokeError('12345')
        , result = parse(stringify(test))
      expect(_.isError(test)).to.be.true
      expect(result.message).to.equal('12345')
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('should stringify & parse RegExp', function() {
      let test = /12345/g
        , result = parse(stringify(test))
      expect(_.isRegExp(result)).to.be.true
      expect(result.test('12345')).to.be.true
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('should stringify & parse Circular', function() {
      let a = {}
        , b = { a }
      a.b = b
      let test = { a, b }
        , result = parse(stringify(test))
      expect(result.a).to.equal(result.b.a)
      expect(result.b).to.equal(result.a.b)
    })
  })
})
