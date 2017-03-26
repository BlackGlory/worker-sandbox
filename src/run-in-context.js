'use strict'

import isString from 'lodash/isString'

function isLegalName(name) {
  return /^[_\$\w][\d\w\$_]*$/.test(name)
}

export function runInContext(code, context = {}) {
  if (isString(code)) {
    let keys, values = []
    keys = Array.from(new Set([
      ...Object.keys({
        keys
      , values
      , code
      , context
      , runInContext
      , isLegalName
      , isString
      })
    ])).filter(isLegalName)
    values.length = keys.length
    values.fill()
    return (new Function(...keys, `
      with(arguments[arguments.length - 1]) {
        return eval(${ JSON.stringify(code) })
      }
    `))(...values, context)
  } else {
    throw new TypeError('First argument must be a string')
  }
}

export default runInContext
