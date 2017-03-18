'use strict'

import _ from 'lodash'

export function runInContext(code, context = {}) {
  if (_.isString(code)) {
    let keys, values
    keys = _.uniq([
      ...Object.keys({
        keys
      , values
      , code
      , context
      , runInContext
      , _
      })
    , ...Object.keys(context)
    ]).filter(x => /^[_\$\w][\d\w\$_]*$/.test(x))
    values = keys.map(x => context[x])
    return eval(`(function(${ keys.join(', ') }) {
      return eval(${ JSON.stringify(code) })
    })`)(...values)
  } else {
    throw new TypeError('First argument must be a string')
  }
}

export default runInContext
