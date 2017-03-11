export const TYPE_SYMBOL = 'type'

export function serializeFunction(fn) {
  return {
    [TYPE_SYMBOL]: 'Function'
  , name: fn.name
  , body: fn.toString()
  }
}

export function unserializeFunction(str) {
  let data = JSON.parse(str)
  if (data[TYPE_SYMBOL] !== 'Function') {
    throw new TypeError('str is not a serialized Function')
  }
  let { name, body } = data
    , fn = eval(body)
  fn.name = name
  return fn
}

export function serializeError(err) {
  return JSON.stringify({
    [TYPE_SYMBOL]: 'Error'
  , name: err.name
  , message: err.message
  , stack: err.stack
  })
}

export function unserializeError(str) {
  let data = JSON.parse(str)
  if (data[TYPE_SYMBOL] !== 'Error') {
    throw new TypeError('str is not a serialized Error')
  }
  let { name, message, stack } = data
    , err = new (window[name] || Error)(message)
  err.stack = stack
  return err
}
