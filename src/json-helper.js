'use strict'

import _ from 'lodash'
import uuidV4 from 'uuid/v4'
import CircularJSON from 'circular-json'

const SYMBOL_KEY = uuidV4()
const SYMBOL_VALUE = uuidV4()

function markSymbol(obj) {
  return Object.assign({}, obj, {
    [SYMBOL_KEY]: SYMBOL_VALUE
  })
}

function validateSymbol(obj) {
  return obj[SYMBOL_KEY] === SYMBOL_VALUE
}

function wrap(value) {
  const SwitchTree = {
    Function(value) {
      return {
        expression: `(${ value.toString() })`
      }
    }
  , Error(value) {
      return {
        name: value.name
      , message: value.message
      , stack: value.stack
      }
    }
  , RegExp(value) {
      return {
        expression: value.toString()
      }
    }
  }
  for (let type of Object.keys(SwitchTree)) {
    if (_[`is${ type }`](value)) {
      return Object.assign({}, SwitchTree[type](value), { type })
    }
  }
}

function unwrap(data) {
  const SwitchTree = {
    Function({ expression }) {
      return eval(expression)
    }
  , Error({ name, message, stack }) {
      let err = new (window[name] || Error)(message)
      err.stack = stack
      return err
    }
  , RegExp({ expression }) {
      return eval(expression)
    }
  }
  return SwitchTree[data.type](data)
}

export function replacer(key, value) {
  let wrapped = wrap(value)
  if (_.isPlainObject(wrapped)) {
    return markSymbol(wrapped)
  } else {
    return value
  }
}

export function reviver(key, value) {
  if (validateSymbol(value)) {
    return unwrap(value)
  } else {
    return value
  }
}

export function stringify(value, space) {
  return JSON.stringify(value, replacer, space)
}

export function parse(text) {
  return JSON.parse(text, reviver)
}

export function stringifyCircular(value, space) {
  return CircularJSON.stringify(value, replacer, space)
}

export function parseCircular(text) {
  return CircularJSON.parse(text, reviver)
}
