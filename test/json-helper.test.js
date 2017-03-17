import { expect } from 'chai'
import { stringify, parse, replacer, reviver } from '../src/json-helper'
import _ from 'lodash'

describe('JSON', function() {
  describe('stringify & parse', function() {
    it('Function', function() {
      let test = () => 12345
        , result = parse(stringify(test))
      expect(_.isFunction(result)).to.be.true
      expect(result()).to.equal(test())
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('Generator', function() {
      let test = function* () {
            yield 12345
          }
        , result = parse(stringify(test))
      expect(_.isFunction(result)).to.be.true
      expect([...result()]).to.deep.equal([...test()])
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('Error', function() {
      let test = new Error('12345')
        , result = parse(stringify(test))
      expect(_.isError(test)).to.be.true
      expect(result.message).to.equal('12345')
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('RegExp', function() {
      let test = /12345/g
        , result = parse(stringify(test))
      expect(_.isRegExp(result)).to.be.true
      expect(result.test('12345')).to.be.true
      expect(stringify(test)).to.equal(JSON.stringify(test, replacer))
    })

    it('Circular', function() {
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
