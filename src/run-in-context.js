'use strict'

import isString from 'lodash/isString'
import isFunction from 'lodash/isFunction'
import uniq from 'lodash/uniq'
import { createFunctionExpression } from './json-helper'

export function runInContext(code, context = {}) {
  if (isString(code)) {
    let keys, values
    keys = uniq([
      ...Object.keys({
        keys
      , values
      , code
      , context
      , runInContext
      , callInContext
      , isString
      , isFunction
      , uniq
      , createFunctionExpression
      })
    , ...Object.keys(context)
    ]).filter(x => /^[_\$\w][\d\w\$_]*$/.test(x))
    values = keys.map(x => context[x])
    return (new Function(...keys, `return eval(${ JSON.stringify(code) })`))(...values)
  } else {
    throw new TypeError('First argument must be a string')
  }
}

export function callInContext(fn, args = [], context = {}) {
  if (isFunction(fn)) {
    let keys, values
    keys = uniq([
      ...Object.keys({
        keys
      , values
      , fn
      , context
      , runInContext
      , callInContext
      , isString
      , isFunction
      , uniq
      , createFunctionExpression
      })
    , ...Object.keys(context)
    ]).filter(x => /^[_\$\w][\d\w\$_]*$/.test(x))
    values = keys.map(x => context[x])
    return (new Function(...keys, `return arguments[arguments.length - 1]`))(...values, fn)(...args)
  } else {
    throw new TypeError('First argument must be a function')
  }
}

export default runInContext
