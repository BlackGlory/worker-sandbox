export function createAsyncProxy(fn) {
  function wrapper(path = []) {
    return new Proxy(function() {}, {
      get(_, prop, receiver) {
        if (['then', 'catch'].includes(prop)) {
          let promise = new Promise(async function(resolve, reject) {
            try {
              resolve(await fn(path))
            } catch(e) {
              reject(e)
            }
          })
          return promise[prop].bind(promise)
        }
        return wrapper([...path, prop])
      }
    , async apply(_, thisArg, argumentsList) {
        return await (await fn(path)).apply(thisArg, argumentsList)
      }
    })
  }
  return wrapper()
}
