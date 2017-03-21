'use strict'

class CallableFunction extends Function {}

export function convertPathListToString(list) {
  return list.map(x => `["${ x.replace(/\"/g, '\\"') }"]`).join('')
}

export function createAsyncProxyHub(target, handler = {}) {
  const defaultHandler = {
    get(target, path) {
      return getPropertyByPath(target, convertPathListToString(path))
    }
  , apply(target, path, caller, args) {
      return getPropertyByPath(target, convertPathListToString(path)).apply(caller, args)
    }
  , set(target, path, value) {
      return setPropertyByPath(target, convertPathListToString(path), value)
    }
  , deleteProperty(target, path) {
      return deletePropertyByPath(target, convertPathListToString(path))
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

export function getPropertyByPath(obj, path) {
  if (!path) {
    return obj
  }
  if (['.', '['].includes(path[0])) {
    return eval(`obj${ path }`)
  } else {
    return eval(`obj.${ path }`)
  }
}

export function setPropertyByPath(obj, path, value) {
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

export function deletePropertyByPath(obj, path) {
  if (!path) {
    throw new Error('Cannot remove target object itself')
  }
  if (['.', '['].includes(path[0])) {
    return eval(`delete obj${ path }`)
  } else {
    return eval(`delete obj.${ path }`)
  }
}
