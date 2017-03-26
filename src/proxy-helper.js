'use strict'

import isFunction from 'lodash/isFunction'
import isString from 'lodash/isString'

class CallableFunction extends Function {}

export function convertPathListToString(list) {
  return list.map(x => `["${ x.replace(/\"/g, '\\"') }"]`).join('')
}

export function createAsyncProxyHub(target, handler = {}) {
  const defaultHandler = {
    get(target, path) {
      return getPropertyByPath(target, path)
    }
  , apply(target, path, caller, args) {
      let fn = getPropertyByPath(target, path)
      if (isFunction(fn)) {
        return fn.apply(caller, args)
      } else {
        throw new TypeError(`${ path[path.length - 1] } is not a function`)
      }
    }
  , set(target, path, value) {
      return setPropertyByPath(target, path, value)
    }
  , deleteProperty(target, path) {
      return deletePropertyByPath(target, path)
    }
  }

  handler = Object.assign({}, defaultHandler, handler)

  function wrapper(path = []) {
    return new Proxy(CallableFunction, {
      get(_, prop) {
        if (['then', 'catch'].includes(prop)) {
          let promise = new Promise(async function(resolve, reject) {
            try {
              resolve(await handler.get(target, path))
            } catch(e) {
              reject(e)
            }
          })
          return promise[prop].bind(promise)
        }
        return wrapper([...path, prop])
      }
    , apply(_, caller, args) {
        return handler.apply(target, path, caller, args)
      }
    , set(_, prop, value) {
        return handler.set(target, [...path, prop], value)
      }
    , deleteProperty(_, prop) {
        return handler.deleteProperty(target, [...path, prop])
      }
    })
  }
  return wrapper()
}

export function getPropertyByPath(obj, path = []) {
  if (isString(path)) {
    return getPropertyByPathString(obj, path)
  }
  let temp = obj
  for (let i = 0, len = path.length; i < len; ++i) {
    temp = temp[path[i]]
  }
  return temp
}

export function setPropertyByPath(obj, path = [], value) {
  if (isString(path)) {
    return setPropertyByPathString(obj, path, value)
  }
  if (path.length === 0) {
    throw new Error('Cannot assign target object itself')
  }
  let temp = obj
  for (let i = 0, len = path.length; i < len; ++i) {
    if (i === len - 1) {
      temp[path[i]] = value
    } else {
      temp = temp[path[i]]
    }
  }
  return true
}

export function deletePropertyByPath(obj, path = []) {
  if (isString(path)) {
    return deletePropertyByPathString(obj, path)
  }
  if (path.length === 0) {
    throw new Error('Cannot remove target object itself')
  }
  let temp = obj
  for (let i = 0, len = path.length; i < len; ++i) {
    if (i === len - 1) {
      delete temp[path[i]]
    } else {
      temp = temp[path[i]]
    }
  }
  return true
}

export function getPropertyByPathString(obj, path) {
  if (!path) {
    return obj
  }
  if (['.', '['].includes(path[0])) {
    return eval(`obj${ path }`)
  } else {
    return eval(`obj.${ path }`)
  }
}

export function setPropertyByPathString(obj, path, value) {
  if (!path) {
    throw new Error('Cannot assign target object itself')
  }
  try {
    if (['.', '['].includes(path[0])) {
      eval(`obj${ path } = value`)
    } else {
      eval(`obj.${ path } = value`)
    }
    return true
  } catch(e) {
    throw e
  }
}

export function deletePropertyByPathString(obj, path) {
  if (!path) {
    throw new Error('Cannot remove target object itself')
  }
  if (['.', '['].includes(path[0])) {
    return eval(`delete obj${ path }`)
  } else {
    return eval(`delete obj.${ path }`)
  }
}
