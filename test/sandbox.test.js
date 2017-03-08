import test from 'ava'
import phantom from 'phantom'
import path from 'path'

function runInPhantom(fn) {
  return new Promise(async (resolve, reject) => {
    const HTML_URL = `file:///${ path.resolve('test/sandbox.test.html') }`.replace(/\\/g, '/')
    const ph = await phantom.create(['--web-security=no'])
    const page = await ph.createPage()
    await page.open(HTML_URL)
    await page.on('onCallback', async (data) => {
      resolve(data)
      await ph.exit()
    })
    await page.evaluateAsync(fn)
  })
}

test('eval', async t => {
  t.is(await runInPhantom(function() {
    let sandbox = new Sandbox.default()
    sandbox.eval('12345').then(window.callPhantom)
  }), 12345)
})

test('execute', async t => {
  t.is(await runInPhantom(function() {
    let sandbox = new Sandbox.default()
    sandbox.execute('12345').then(data =>
      data === undefined && window.callPhantom())
  }), undefined)
})
