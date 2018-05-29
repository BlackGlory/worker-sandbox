# worker-sandbox [![npm](https://img.shields.io/npm/v/worker-sandbox.svg?maxAge=2592000)](https://www.npmjs.com/package/worker-sandbox) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/BlackGlory/worker-sandbox/master/LICENSE) [![Build Status](https://travis-ci.org/BlackGlory/worker-sandbox.svg?branch=master)](https://travis-ci.org/BlackGlory/worker-sandbox) [![Coverage Status](https://coveralls.io/repos/github/BlackGlory/worker-sandbox/badge.svg)](https://coveralls.io/github/BlackGlory/worker-sandbox)

The Javascript sandbox based on Web Workers.

## Usage

### Install

```
npm install --save worker-sandbox
```

OR

```
yarn add worker-sandbox
```

### Quickstart

To build a runInContext function as an example:

```js
import Sandbox from 'worker-sandbox' // Import module

async function runInContext(code, context) {
  try {
    const sandbox = new Sandbox() // Create a sandbox instance
    await sandbox.assign(context) // Assign the context of the sandbox
    return await sandbox.eval(code) // Run the code
  } finally {
    sandbox.destroy() // Destroy the Web Worker instance in the sandbox
  }
}

runInContext('sayHelloWorld()', {
  helloWorld: 'hello world'
, sayHelloWorld() {
    return helloWorld
  }
})
.then(console.log) // hello world
```

## API

### class Sandbox([worker: Worker])

Use the `new` operator to create a sandbox instance, and the Sandbox class constructor has no arguments.

```js
const sandbox = new Sandbox()
sandbox instanceof Sandbox // true
```

You can also use your own Worker instance, see below.

#### Sandbox#eval(code: string): Promise\<any>

Eval code in the sandbox.

```js
const sandbox = new Sandbox()
const result = await sandbox.eval('"hello world"')
result === 'hello world' // true
```

#### Sandbox#execute(code: string): Promise\<void>

No return value version of `Sandbox#eval`.

```js
const sandbox = new Sandbox()
const result = await sandbox.execute('"hello world"')
result === undefined // true
```

#### Sandbox#context: { [string]: any }

This is an asynchronous Proxy object that can be used as syntactic sugar for `Sandbox#set`, `Sandbox#get`, `Sandbox#remove`, `Sandbox#call`.

```js
const sandbox = new Sandbox()

// Get the full context
await sandbox.context // {}

// Set the value of a specific path
sandbox.context.helloWorld = 'hello world'

// Get the value of a specific path
await sandbox.context.helloWorld === 'hello world' // true

// Set a specific path as a function
sandbox.context.sayHelloWorld = speaker =>
  `${ speaker }: ${ helloWorld }`

// Call a function of a specific path (the actual function runs in the sandbox)
await sandbox.context.sayHelloWorld('Sandbox') === 'Sandbox: hello world'

// Remove the value of a specific path
delete sandbox.context.helloWorld
delete sandbox.context.sayHelloWorld
await sandbox.context.helloWorld === undefined // true
await sandbox.context.sayHelloWorld === undefined // true
```

#### Sandbox#set(path: string | string[], value: any): Promise\<void>

Set the value of a specific path in the sandbox context.

```js
const sandbox = new Sandbox()
await sandbox.set('arr', [])
await sandbox.set('arr[0]', 'hello')
await sandbox.set('arr[1]', 'world')
await sandbox.set(['arr[2]'], 'arr[2]')
(await sandbox.context.arr).join(' ') === 'hello world' // true
await sandbox.context['arr[2]'] === 'arr[2]' // true
```

Equivalent to

```js
const sandbox = new Sandbox()
await sandbox.set('arr', [])
await sandbox.set(['arr', '0'], 'hello')
await sandbox.set(['arr', '1'], 'world')
await sandbox.set(['arr[2]'], 'arr[2]')
(await sandbox.context.arr).join(' ') === 'hello world' // true
await sandbox.context['arr[2]'] === 'arr[2]' // true
```

Equivalent to

```js
const sandbox = new Sandbox()
sandbox.context.arr = []
sandbox.context.arr[0] = 'hello'
sandbox.context.arr[1] = 'world'
sandbox.context['arr[2]'] = 'arr[2]'
(await sandbox.context.arr).join(' ') === 'hello world' // true
await sandbox.context['arr[2]'] === 'arr[2]' // true
```

#### Sandbox#assign(obj: any) : Promise\<void>

It is the `Object.assign()` for `Sandbox#context`.

```js
const sandbox = new Sandbox()
await sandbox.assign({
  hello: 'hello'
, world: 'world'
, sayHelloWorld() {
    return `${ hello } ${ world}`
  }
, 'functions.sayHelloWorld': function() {
    return `${ hello } ${ world}`
  }
})
await sandbox.context.sayHelloWorld() === 'hello world' // true
await sandbox.context['functions.sayHelloWorld']() === 'hello world' // true
```

Equivalent to

```js
const sandbox = new Sandbox()
Object.assign(sandbox.context, {
  hello: 'hello'
, world: 'world'
, sayHelloWorld() {
    return `${ hello } ${ world}`
  }
, ['functions.sayHelloWorld']() {
    return `${ hello } ${ world}`
  }
})
await sandbox.context.sayHelloWorld() === 'hello world' // true
await sandbox.context['functions.sayHelloWorld']() === 'hello world' // true
```

#### Sandbox#get(path: string | string[]): Promsie\<any>

Get the value of a specific path in the sandbox context.

```js
const sandbox = new Sandbox()
await sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.get('obj.hello') === 'hello' // true
await sandbox.get('obj["world"]') === 'world' // true
```

Equivalent to

```js
const sandbox = new Sandbox()
sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.get(['obj', 'hello']) === 'hello' // true
await sandbox.get(['obj', 'world']) === 'world' // true
```

Equivalent to

```js
const sandbox = new Sandbox()
await sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.context.obj.hello === 'hello' // true
await sandbox.context.obj['world'] === 'world' // true
```

#### Sandbox#remove(path: string | string[]): Promise\<void>

Remove the value of a specific path in the sandbox context.

```js
const sandbox = new Sandbox()
await sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.remove('obj.hello')
await sandbox.remove('obj["world"]')
await sandbox.context.obj // {}
```

Equivalent to

```js
const sandbox = new Sandbox()
await sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.remove(['obj', 'hello'])
await sandbox.remove(['obj', 'world'])
await sandbox.context.obj // {}
```

Equivalent to

```js
const sandbox = new Sandbox()
await sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
delete sandbox.context.obj.hello
delete sandbox.context.obj.world
await sandbox.context.obj // {}
```

#### Sandbox#call(path: string | string[], ...args: any[]): Promise\<any>

Calling a function within a sandbox context within a specific path, the actual function runs in the sandbox.

```js
const sandbox = new Sandbox()
sandbox.context.helloWorld = 'hello world'
sandbox.context.functions = {}
sandbox.context.functions.sayHelloWorld = speaker =>
  `${ speaker }: ${ helloWorld }`
await sandbox.call('functions.sayHelloWorld', 'Sandbox') === 'Sandbox: hello world' // true
```

Equivalent to

```js
const sandbox = new Sandbox()
sandbox.context.helloWorld = 'hello world'
sandbox.context.functions = {}
sandbox.context.functions.sayHelloWorld = speaker =>
  `${ speaker }: ${ helloWorld }`
await sandbox.call(['functions', 'sayHelloWorld'], 'Sandbox') === 'Sandbox: hello world' // true
```

Equivalent to

```js
const sandbox = new Sandbox()
sandbox.context.helloWorld = 'hello world'
sandbox.context.functions = {}
sandbox.context.functions.sayHelloWorld = speaker => {
  `${ speaker }: ${ helloWorld }`
await sandbox.context.functions.sayHelloWorld('Sandbox') === 'Sandbox: hello world' // true
```

#### Sandbox#callable : { [string]: Function }

This is an asynchronous Proxy object that can be used as syntactic sugar for `Sandbox#registerCall` and `Sandbox#cancelCall`.

```js
const sandbox = new Sandbox()
const helloWorld = 'hello world'

// Register the Callable function
sandbox.callable.sayHelloWorld = function(speaker) {
  return `${ speaker }: ${ helloWorld }`
}

// Call the Callable function
await sandbox.eval('sayHelloWorld("Sandbox")') === 'Sandbox: hello world' // true

// Cancel registered Callable function
delete sandbox.callable.sayHelloWorld
await sandbox.eval('sayHelloWorld') // ReferenceError!
```

#### Sandbox#registerCall(path: string | string[], func: Function): Promise\<void>

Register a Callable function in the sandbox, which can be called in the sandbox, but the actual function is done outside the sandbox.

```js
const sandbox = new Sandbox()
const helloWorld = 'hello world'
await sandbox.registerCall('sayHelloWorld', speaker =>
  `${ speaker }: ${ helloWorld }`
)
await sandbox.eval('sayHelloWorld("Sandbox")') === 'Sandbox: hello world' // true
```

#### Sandbox#cancelCall(path: string | string[]): Promise\<void>

Cancel registered Callable function.

```js
const sandbox = new Sandbox()
const helloWorld = 'hello world'
await sandbox.registerCall('sayHelloWorld', speaker =>
  `${ speaker }: ${ helloWorld }`
)
await sandbox.cancelCall('sayHelloWorld')
await sandbox.eval('sayHelloWorld')  // ReferenceError
```

#### Sandbox#destroy(): void

Destroy the Web Worker in the instance of the sandbox, which will call the `Worker#terminate ()` to terminate the Web Worker.

```js
const sandbox = new Sandbox()
sandbox.destroy()
```

## Advanced

### Custom worker

The minimal worker code is:

```js
import { MessageSystem, PERMISSION } from 'message-system'
import { WorkerMessenger } from 'message-system-worker-messenger'

(self as any)['window'] = self

new MessageSystem(new WorkerMessenger(), [
  PERMISSION.RECEIVE.EVAL
, PERMISSION.RECEIVE.CALL
, PERMISSION.RECEIVE.ASSIGN
, PERMISSION.RECEIVE.ACCESS
, PERMISSION.RECEIVE.REMOVE
, PERMISSION.RECEIVE.REGISTER
, PERMISSION.SEND.CALL
], {/* add your context here */})
```

## Tips

The `await` operator can be omitted when you call `Sandbox#set`, `Sandbox#assign`,` Sandox#remove`, `Sandbox#registerCall`,` Sandbox#cancelCall` in the `async` function. Because the Web Worker inside the sandbox is single-threaded, the asynchronous methods are executed in the order they are called, the `await` operator is just need added when calling a function that requires a return value.

```js
const sandbox = new Sandbox()
for (let i = 1000; i--;) {
  sandbox.set('hello', 'hello')
  sandbox.assign({
    world: 'world'
  , removable: 'removable'
  })
  sandbox.remove('removable')
}
await sandbox.context.removable === undefined // true
await sandbox.context.hello === 'hello' // true
await sandbox.context.world === 'world' // true
```

## Projects using worker-sandbox

[gloria-sandbox: Sandbox for Gloria based on worker-sandbox](https://github.com/BlackGlory/gloria-sandbox)
