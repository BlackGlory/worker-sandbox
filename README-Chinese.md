# worker-sandbox
Javascript Web Workers 沙箱.

[English document](https://github.com/BlackGlory/worker-sandbox/blob/master/README.md)

## 使用

### 安装

```
npm install --save worker-sandbox
```

或

```
yarn add worker-sandbox
```

### 快速开始

以构建一个 runInContext 函数为例:

```js
import Sandbox from 'worker-sandbox' // 导入模块

async function runInContext(code, context) {
  try {
    let sandbox = new Sandbox() // 创建沙箱实例
    await sandbox.assign(context) // 对沙箱的上下文赋值
    return await sandbox.eval(code) // 运行代码
  } finally {
    sandbox.destroy() // 销毁沙箱内的 Web Worker 实例
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

使用 `new` 运算符创建一个沙箱实例, Sandbox 类的构造函数没有参数.

```js
let sandbox = new Sandbox()
sandbox instanceof Sandbox // true
```

#### async Sandbox#eval(code: string | Function[, destroyTimeout: number]) : any

在沙箱内执行代码, 如果提供 destroyTimeout 参数(单位为毫秒), 则当执行代码的时长超过特定值时, 会返回一个 TimeoutError 异常.

```js
let sandbox = new Sandbox()
  , result = await sandbox.eval('"hello world"')
result === 'hello world' // true
```

使用 destroyTime

```js
let sandbox = new Sandbox()
try {
  await sandbox.eval('while(true) {}', 1000)
} catch(e) {
  e instanceof TimeoutError // true
}
```

#### async Sandbox#execute(code: string | Function[, destroyTimeout: number]) : void

无返回值版本的 `Sandbox#eval`.

```js
let sandbox = new Sandbox()
  , result = await sandbox.execute('"hello world"')
result === undefined // true
```

#### Sandbox#context : { [string]: any }

这是一个异步 Proxy 对象, 可作为 `Sandbox#set`, `Sandbox#get`, `Sandbox#remove`, `Sandbox#call` 的语法糖使用.

```js
let sandbox = new Sandbox()

// 获取完整上下文
await sandbox.context // {}

// 设置特定路径的值
sandbox.context.helloWorld = 'hello world'

// 获取特定路径的值
await sandbox.context.helloWorld === 'hello world' // true

// 设置特定路径为函数
sandbox.context.sayHelloWorld = function(speaker) {
  return `${ speaker }: ${ helloWorld }`
}

// 调用特定路径的函数(实际的函数运行在沙箱内完成)
await sandbox.context.sayHelloWorld('Sandbox') === 'Sandbox: hello world'

// 移除特定路径的值
delete sandbox.context.helloWorld
delete sandbox.context.sayHelloWorld
await sandbox.context.helloWorld === undefined // true
await sandbox.context.sayHelloWorld === undefined // true
```

#### async Sandbox#set(path: Array<string> | string, value: any) : void

设置沙箱上下文内特定路径的值.

```js
let sandbox = new Sandbox()
await sandbox.set('arr', [])
await sandbox.set('arr[0]', 'hello')
await sandbox.set('arr[1]', 'world')
await sandbox.set(['arr[2]'], 'arr[2]')
(await sandbox.context.arr).join(' ') === 'hello world' // true
await sandbox.context['arr[2]'] === 'arr[2]' // true
```

等价于

```js
let sandbox = new Sandbox()
await sandbox.set('arr', [])
await sandbox.set(['arr', '0'], 'hello')
await sandbox.set(['arr', '1'], 'world')
await sandbox.set(['arr[2]'], 'arr[2]')
(await sandbox.context.arr).join(' ') === 'hello world' // true
await sandbox.context['arr[2]'] === 'arr[2]' // true
```

等价于

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

相当于 `Sandbox#context` 的 `Object.assign`.

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

等价于

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

获取沙箱上下文内特定路径的值.

```js
let sandbox = new Sandbox()
await sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.get('obj.hello') === 'hello' // true
await sandbox.get('obj["world"]') === 'world' // true
```

等价于

```js
let sandbox = new Sandbox()
sandbox.set('obj', {
  hello: 'hello'
, world: 'world'
})
await sandbox.get(['obj', 'hello']) === 'hello' // true
await sandbox.get(['obj', 'world']) === 'world' // true
```

等价于

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

移除沙箱上下文内特定路径的值.

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

等价于

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

等价于

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

调用沙箱上下文内特定路径的函数, 实际的函数运行在沙箱内完成.

```js
let sandbox = new Sandbox()
sandbox.context.helloWorld = 'hello world'
sandbox.context.functions = {}
sandbox.context.functions.sayHelloWorld = function(speaker) {
  return `${ speaker }: ${ helloWorld }`
}
await sandbox.call('functions.sayHelloWorld', 'Sandbox') === 'Sandbox: hello world' // true
```

等价于

```js
let sandbox = new Sandbox()
sandbox.context.helloWorld = 'hello world'
sandbox.context.functions = {}
sandbox.context.functions.sayHelloWorld = function(speaker) {
  return `${ speaker }: ${ helloWorld }`
}
await sandbox.call(['functions', 'sayHelloWorld'], 'Sandbox') === 'Sandbox: hello world' // true
```

等价于

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

这是一个异步 Proxy 对象, 可作为 `Sandbox#registerCall` 和 `Sandbox#cancelCall` 的语法糖使用.

```js
let sandbox = new Sandbox()
  , helloWorld = 'hello world'

// 注册 Callable 函数
sandbox.callable.sayHelloWorld = function(speaker) {
  return `${ speaker }: ${ helloWorld }`
}

// 调用 Callable 函数
await sandbox.eval('sayHelloWorld("Sandbox")') === 'Sandbox: hello world' // true

// 反注册 Callable 函数
delete sandbox.callable.sayHelloWorld
await sandbox.eval('sayHelloWorld') // ReferenceError!
```

#### async Sandbox#registerCall(path: string | Array<string>, func: Function) : void

在沙箱里注册一个 Callable 函数, 该函数可在沙箱中调用, 但实际的函数运行是在沙箱外完成的.

```js
let sandbox = new Sandbox()
  , helloWorld = 'hello world'
await sandbox.registerCall('sayHelloWorld', function(speaker) {
  return `${ speaker }: ${ helloWorld }`
})
await sandbox.eval('sayHelloWorld("Sandbox")') === 'Sandbox: hello world' // true
```

#### async Sandbox#cancelCall(path: string | Array<string>) : void

反注册 Callable 函数.

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

用于验证沙箱内的 Web Worker 是否可用, 当 `Sandbox#destroy()` 被调用后, 它的值会变成 `false`.

```js
let sandbox = new Sandbox()
sandbox.available // true
```

#### Sandbox#destroy() : boolean

销毁沙箱实例内的 Web Worker, 它会调用 `Worker#terminate()` 来终止 Web Worker. 如果 Web Worker 被这次调用终止了, 会返回 `true`, 其他情况都会返回 `false`.

```js
let sandbox = new Sandbox()
sandbox.available // true
sandbox.destroy() // true
sandbox.available // false
sandbox.destroy() // false
sandbox.available // false
```

#### class TimeoutError

使用 `new` 运算符创建一个 TimeoutError 实例, 构造函数的参数与 Error 一致.

```js
import { TimeoutError } from 'worker-sandbox'
let err = new TimeoutError('You overtime!')
err instanceof TimeoutError // true
err.message // You overtime!
```

**TimeoutError 仅用于使用 `instanceof` 运算符检测异常类型的情况, 请勿手动创建 TimeoutError 实例.**

## 小技巧

当你在 `async` 函数调用 `Sandbox#set`, `Sandbox#assign`, `Sandox#remove`, `Sandbox#registerCall`, `Sandbox#cancelCall` 等方法时, 可以省略 `await` 运算符. 这是因为沙箱内部的 Web Worker 是单线程运行的, 所以这些异步方法也会按照调用顺序执行, 仅需在调用需要返回值的函数时, 加上 `await` 运算符.

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

## 使用 worker-sandbox 的项目

[gloria-sandbox: Sandbox for Gloria based on worker-sandbox](https://github.com/BlackGlory/gloria-sandbox)

## 引擎盖下

worker-sandbox 模块的技术原理较为复杂, 需要很长的篇幅解释, 关于技术原理的详细说明, 正在编写中.