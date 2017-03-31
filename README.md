# worker-sandbox
Javascript Web Workers Sandbox.

[中文文档](https://github.com/BlackGlory/worker-sandbox/blob/master/README-Chinese.md)

## Usage

### Installation

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
    let sandbox = new Sandbox() // Create a sandbox instance
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

### class Sandbox()

Use the `new` operator to create a sandbox instance, and the Sandbox class constructor has no arguments.

```js
let sandbox = new Sandbox()
sandbox instanceof Sandbox // true
```

#### async Sandbox#eval(code: string | Function[, destroyTimeout: number]) : any

Eval code in the sandbox. If the destroyTimeout parameter (milliseconds) is provided, a TimeoutError exception is returned when the execution code exceeds the specified time.

```js
let sandbox = new Sandbox()
  , result = await sandbox.eval('"hello world"')
result === 'hello world' // true
```

Use destroyTime

```js
let sandbox = new Sandbox()
try {
  await sandbox.eval('while(true) {}', 1000)
} catch(e) {
  e instanceof TimeoutError // true
}
```

#### async Sandbox#execute(code: string | Function[, destroyTimeout: number]) : void

No return value version of `Sandbox#eval`.

```js
let sandbox = new Sandbox()
  , result = await sandbox.execute('"hello world"')
result === undefined // true
```

#### Sandbox#context : { [string]: any }

This is an asynchronous Proxy object that can be used as syntactic sugar for `Sandbox#set`, `Sandbox#get`, `Sandbox#remove`, `Sandbox#call`.

```js
let sandbox = new Sandbox()

// Get the full context
await sandbox.context // {}

// Set the value of a specific path
sandbox.context.helloWorld = 'hello world'

// Get the value of a specific path
await sandbox.context.helloWorld === 'hello world' // true

// Set a specific path as a function
sandbox.context.sayHelloWorld = function(speaker) {
  return `${ speaker }: ${ helloWorld }`
}

// Call a function of a specific path (the actual function runs in the sandbox)
await sandbox.context.sayHelloWorld('Sandbox') === 'Sandbox: hello world'

// Remove the value of a specific path
delete sandbox.context.helloWorld
delete sandbox.context.sayHelloWorld
await sandbox.context.helloWorld === undefined // true
await sandbox.context.sayHelloWorld === undefined // true
```

#### async Sandbox#set(path: Array<string> | string, value: any) : void

Set the value of a specific path in the sandbox context.

```js
let sandbox = new Sandbox()
await sandbox.set('arr', [])
await sandbox.set('arr[0]', 'hello')
await sandbox.set('arr[1]', 'world')
await sandbox.set(['arr[2]'], 'arr[2]')
(await sandbox.context.arr).join(' ') === 'hello world' // true
await sandbox.context['arr[2]'] === 'arr[2]' // true
```

Equivalent to

```js
let sandbox = new Sandbox()
await sandbox.set('arr', [])
await sandbox.set(['arr', '0'], 'hello')
await sandbox.set(['arr', '1'], 'world')
await sandbox.set(['arr[2]'], 'arr[2]')
(await sandbox.context.arr).join(' ') === 'hello world' // true
await sandbox.context['arr[2]'] === 'arr[2]' // true
```

Equivalent to

```js
let sandbox = new Sandbox()
sandbox.context.arr = []
sandbox.context.arr[0] = 'hello'
sandbox.context.arr[1] = 'world'
sandbox.context['arr[2]'] = 'arr[2]'
(await sandbox.context.arr).join(' ') === 'hello world' // true
await sandbox.context['arr[2]'] === 'arr[2]' // true
```

#### async Sandbox#assign(obj: { [string]: any }) : void

It is the `Object.assign()` for `Sandbox#context`.

```js
let sandbox = new Sandbox()
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
let sandbox = new Sandbox()
Object.assign(sandbox.context, {
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

#### async Sandbox#get(path: Array<string> | string) : any

Get the value of a specific path in the sandbox context.

```js
let sandbox = new Sandbox()
await sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.get('obj.hello') === 'hello' // true
await sandbox.get('obj["world"]') === 'world' // true
```

Equivalent to

```js
let sandbox = new Sandbox()
sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.get(['obj', 'hello']) === 'hello' // true
await sandbox.get(['obj', 'world']) === 'world' // true
```

Equivalent to

```js
let sandbox = new Sandbox()
await sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.context.obj.hello === 'hello' // true
await sandbox.context.obj['world'] === 'world' // true
```

#### async Sandbox#remove(path: Array<string> | string) : void

Remove the value of a specific path in the sandbox context.

```js
let sandbox = new Sandbox()
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
let sandbox = new Sandbox()
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
let sandbox = new Sandbox()
await sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
delete sandbox.context.obj.hello
delete sandbox.context.obj.world
await sandbox.context.obj // {}
```

#### async Sandbox#call(path: Array<string> | string, ...args: Array<any>) : any

Calling a function within a sandbox context within a specific path, the actual function runs in the sandbox.

```js
let sandbox = new Sandbox()
sandbox.context.helloWorld = 'hello world'
sandbox.context.functions = {}
sandbox.context.functions.sayHelloWorld = function(speaker) {
  return `${ speaker }: ${ helloWorld }`
}
await sandbox.call('functions.sayHelloWorld', 'Sandbox') === 'Sandbox: hello world' // true
```

Equivalent to

```js
let sandbox = new Sandbox()
sandbox.context.helloWorld = 'hello world'
sandbox.context.functions = {}
sandbox.context.functions.sayHelloWorld = function(speaker) {
  return `${ speaker }: ${ helloWorld }`
}
await sandbox.call(['functions', 'sayHelloWorld'], 'Sandbox') === 'Sandbox: hello world' // true
```

Equivalent to

```js
let sandbox = new Sandbox()
sandbox.context.helloWorld = 'hello world'
sandbox.context.functions = {}
sandbox.context.functions.sayHelloWorld = function(speaker) {
  return `${ speaker }: ${ helloWorld }`
}
await sandbox.context.functions.sayHelloWorld('Sandbox') === 'Sandbox: hello world' // true
```

#### Sandbox#callable : { [string]: Function }

This is an asynchronous Proxy object that can be used as syntactic sugar for `Sandbox#registerCall` and `Sandbox#cancelCall`.

```js
let sandbox = new Sandbox()
  , helloWorld = 'hello world'

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

#### async Sandbox#registerCall(path: string | Array<string>, func: Function) : void

Register a Callable function in the sandbox, which can be called in the sandbox, but the actual function is done outside the sandbox.

```js
let sandbox = new Sandbox()
  , helloWorld = 'hello world'
await sandbox.registerCall('sayHelloWorld', function(speaker) {
  return `${ speaker }: ${ helloWorld }`
})
await sandbox.eval('sayHelloWorld("Sandbox")') === 'Sandbox: hello world' // true
```

#### async Sandbox#cancelCall(path: string | Array<string>) : void

Cancel registered Callable function.

```js
let sandbox = new Sandbox()
  , helloWorld = 'hello world'
await sandbox.registerCall('sayHelloWorld', function(speaker) {
  return `${ speaker }: ${ helloWorld }`
})
await sandbox.cancelCall('sayHelloWorld')
await sandbox.eval('sayHelloWorld')  // ReferenceError!
```

#### readonly Sandbox#available : boolean

Used to confirm that the Web Worker within the sandbox is available, and when `Sandbox#destroy()` is called, its value becomes `false`.

```js
let sandbox = new Sandbox()
sandbox.available // true
```

#### Sandbox#destroy() : boolean

Destroy the Web Worker in the instance of the sandbox, which will call the `Worker#terminate ()` to terminate the Web Worker. If the Web Worker is terminated by this call, it will return `true`, other cases will return `false`.

```js
let sandbox = new Sandbox()
sandbox.available // true
sandbox.destroy() // true
sandbox.available // false
sandbox.destroy() // false
sandbox.available // false
```

#### class TimeoutError

Use the `new` operator to create a TimeoutError instance with the constructor parameter consistent with Error.

```js
let err = new TimeoutError('You overtime!')
err instanceof TimeoutError // true
err.message // You overtime!
```

**TimeoutError is only used to detect the exception type using the `instanceof` operator. Do not create a TimeoutError instance manually.**

## Tips

The `await` operator can be omitted when you call `Sandbox#set`, `Sandbox#assign`,` Sandox#remove`, `Sandbox#registerCall`,` Sandbox#cancelCall` in the `async` function. Because the Web Worker inside the sandbox is single-threaded, the asynchronous methods are executed in the order they are called, the `await` operator is just need added when calling a function that requires a return value.

```js
let sandbox = new Sandbox()
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

## Under the hood

The technical principle of the worker-sandbox module is complex and requires a long document to explanation. A detailed description of the technical principles is being written.