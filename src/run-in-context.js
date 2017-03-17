'use strict'

import _ from 'lodash'

export function runInContext(code, context) {
  function softWith() {
    const BANED_VAR = [
      'postMessage'
    , 'addEventListener'
    , 'close'
    , 'self'
    , 'window'
    , 'softWith'
    , 'runInContext'
    , 'code'
    , 'context'
    , 'BANED_VAR'
    , '_'
    ]
    return `var ${ BANED_VAR.join(', ') }`
  }

  if (_.isString(code)) {
    return eval.bind(context)(`${ softWith() }; ${ code }`)
  } else if (_.isFunction(code)) {
    eval(softWith())
    return code.bind(context)()
  } else {
    throw new TypeError('First argument should be a function or string')
  }
}

export default runInContext
