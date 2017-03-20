'use strict'

import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import isRegExp from 'lodash/isRegExp'
import isError from 'lodash/isError'
import isFunction from 'lodash/isFunction'
import CircularJSON from 'circular-json'
import project from '../package'
import hash from 'object-hash'
import { convertPathListToString } from './proxy-helper'

const SYMBOL_KEY = hash.sha1(project)
const SYMBOL_VALUE = hash.MD5(project)

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
      let func = value.toString()
      if (value.name) {
        // case for class method
        console.log(func)
        let startsWithPosition = 0
        if (func.startsWith('*')) {
          // case for Generator class method
          startsWithPosition = '*'.length // 1
        } else if (func.startsWith('async ')) {
          // case for Async class method
          startsWithPosition = 'async '.length // 6
        }
        if (func.startsWith(value.name, startsWithPosition)) {
          return {
            expression: `({ ${ func } })${ convertPathListToString([ value.name ]) }`
          }
        }
      }
      return {
        expression: `(${ func })`
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
    if ({
      isFunction
    , isError
    , isRegExp
    }[`is${ type }`](value)) {
      return Object.assign({}, SwitchTree[type](value), { type })
    }
  }
}

function unwrap(data) {
  const SwitchTree = {
    Function({ expression }) {
      try {
        return eval(expression)
      } catch(e) {
        return null
      }
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
  if (isPlainObject(wrapped)) {
    return markSymbol(wrapped)
  } else {
    return value
  }
}

export function reviver(key, value) {
  if (value && validateSymbol(value)) {
    return unwrap(value)
  } else {
    return value
  }
}

export function stringify(value, space) {
  return CircularJSON.stringify(value, replacer, space)
}

export function parse(text) {
  if (isString(text)) {
    return CircularJSON.parse(text, reviver)
  }
}
