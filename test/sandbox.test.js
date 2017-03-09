import test from 'ava'
import phantom from 'phantom'
import path from 'path'

function runInPhantom(fn) {
  return new Promise(async (resolve, reject) => {
    const HTML_URL = `file:///${ path.resolve('test/sandbox.test.html') }`.replace(/\\/g, '/')
    const ph = await phantom.create(['--web-security=no'])
    const page = await ph.createPage()
    await page.open(HTML_URL)
    await page.on('onConsoleMessage', async (msg, lineNum, sourceId) => {
      console.log(`CONSOLE: ${ msg } (from line #${ lineNum } in "${ sourceId }")`)
    })
    await page.on('onCallback', async (data) => {
      if (data && data.column && data.line && sourceURL) {
        reject(data)
      } else {
        resolve(data)
      }
      await ph.exit()
    })
    await page.evaluateAsync(fn)
  })
}

test('execute', async t => {
  t.is(await runInPhantom(function() {
    let sandbox = new Sandbox.default()
    sandbox.execute('12345')
    .then(data => {
      data === undefined && window.callPhantom()
    })
  }), undefined)
})

test('eval: return a literal', async t => {
  t.is(await runInPhantom(function() {
    let sandbox = new Sandbox.default()
    sandbox.eval('12345')
    .then(window.callPhantom)
  }), 12345)
})

test('eval: return a Promise', async t => {
  t.is(await runInPhantom(function() {
    let sandbox = new Sandbox.default()
    sandbox.eval('Promise.resolve(12345)')
    .then(window.callPhantom)
  }), 12345)
})

// Phantom unhandled promise rejection
/*
test('eval function', async t => {

  t.is(await runInPhantom(function() {
    let sandbox = new Sandbox.default()
    sandbox.eval(function() {
      return 12345
    })
    .then((...args) => window.callPhantom(...args))
    .catch((...args) => window.callPhantom(...args))
  }), 12345)
})
*/

// Phantom unhandled promise rejection
/*
test('eval with timeout', async t => {
  try {
    await runInPhantom(function() {
      let sandbox = new Sandbox.default()
      sandbox.eval('new Promise(resolve => setTimeout(resolve, 1000))')
      .then((...args) => window.callPhantom(...args))
      .catch((...args) => window.callPhantom(...args))
    })
  } catch(e) {
    t.pass()
  }
})
*/
