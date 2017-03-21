'use strict'

import isString from 'lodash/isString'

export function runInContext(code, context = {}) {
  if (isString(code)) {
    let keys, values
    keys = Array.from(new Set([
      ...Object.keys({
        keys
      , values
      , code
      , context
      , runInContext
      , isString
      })
    , ...Object.keys(context)
    ])).filter(x => /^[_\$\w][\d\w\$_]*$/.test(x))
    values = keys.map(x => context[x])
    return (new Function(...keys, `return eval(${ JSON.stringify(code) })`))(...values)
  } else {
    throw new TypeError('First argument must be a string')
  }
}

export default runInContext
