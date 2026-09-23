const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, dependencies = {}, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  const exports = {}
  vm.runInNewContext(source, {
    exports, require: name => dependencies[name] || require(name),
    process, console: { error() {} }, Headers, URL, AbortSignal, ...globals,
  }, { filename: file })
  return exports
}

const server = load('src/lib/youtube-server.ts', { './ytdlp-path': { ensureYtDlp() {} } })
test('runtime and cookies are passed safely; cookie copy is cleaned on failure', async () => {
  let copied = false
  let cleaned = false
  const fakeExec = () => {}
  fakeExec[require('node:util').promisify.custom] = async (bin, args, options) => {
    assert.equal(bin, '/app/yt-dlp')
    assert.equal(args[args.indexOf('--js-runtimes') + 1], `node:${process.execPath}`)
    assert.ok(args.includes('--ignore-config'))
    assert.equal(args[args.indexOf('--cookies') + 1], require('node:path').join('/tmp/test-cookie-dir', 'cookies.txt'))
    assert.equal(options.timeout, 45000)
    assert.ok(copied)
    throw Object.assign(new Error('extraction failed'), { stderr: 'Sign in to confirm you are not a bot' })
  }
  const isolated = load('src/lib/youtube-server.ts', {
    './ytdlp-path': { ensureYtDlp: async () => '/app/yt-dlp' },
    child_process: { execFile: fakeExec },
    'fs/promises': {
      mkdtemp: async () => '/tmp/test-cookie-dir',
      copyFile: async (source) => { assert.equal(source, '/etc/secrets/youtube-cookies.txt'); copied = true },
      chmod: async (_, mode) => assert.equal(mode, 0o600),
      rm: async dir => { assert.equal(dir, '/tmp/test-cookie-dir'); cleaned = true },
    },
  }, { process: { ...process, env: { YTDLP_COOKIES_FILE: '/etc/secrets/youtube-cookies.txt' } } })
  await assert.rejects(isolated.runYouTube(['--version']), e => e.code === 'YOUTUBE_AUTH_REQUIRED')
  assert.ok(cleaned)
})
class NextResponse extends Response {
  static json(value, init) { return new NextResponse(JSON.stringify(value), init) }
}
function request(id = 'O5gwxm3NxFU', range) {
  return { nextUrl: new URL(`http://localhost/api/audio?v=${id}`), headers: new Headers(range ? { Range: range } : {}), signal: new AbortController().signal }
}
function audio(runYouTube, fetch) {
  return load('src/app/api/audio/route.ts', {
    'next/server': { NextResponse }, '@/lib/youtube-server': { ...server, runYouTube },
  }, { fetch }).GET
}

test('bot challenge has actionable 503 classification', () => {
  const error = server.classifyYouTubeError('ERROR: Sign in to confirm you’re not a bot.')
  assert.equal(error.code, 'YOUTUBE_AUTH_REQUIRED')
  assert.equal(error.status, 503)
})
test('format and unavailable errors remain distinct', () => {
  assert.equal(server.classifyYouTubeError('Requested format is not available').code, 'YOUTUBE_FORMAT_UNAVAILABLE')
  assert.equal(server.classifyYouTubeError('Private video').status, 404)
})
test('invalid IDs and multiple ranges do not start extraction', async () => {
  const get = audio(() => assert.fail('must not extract'))
  assert.equal((await get(request('bad'))).status, 400)
  assert.equal((await get(request(undefined, 'bytes=0-1,4-5'))).status, 416)
  assert.equal((await get(request(undefined, 'bytes=-'))).status, 416)
})
test('audio uses selected direct format and forwards byte ranges', async () => {
  const get = audio(async args => {
    assert.match(args[args.indexOf('-f') + 1], /bestaudio/)
    assert.ok(args.includes('--no-playlist'))
    return JSON.stringify({ url: 'https://media.example/audio', http_headers: { 'User-Agent': 'test-agent' } })
  }, async (url, options) => {
    assert.equal(url, 'https://media.example/audio')
    assert.equal(options.headers.get('range'), 'bytes=10-12')
    assert.equal(options.headers.get('user-agent'), 'test-agent')
    return new Response('abc', { status: 206, headers: { 'Content-Range': 'bytes 10-12/100', 'Content-Type': 'audio/mp4', 'Content-Length': '3', 'Set-Cookie': 'must-not-forward' } })
  })
  const result = await get(request(undefined, 'bytes=10-12'))
  assert.equal(result.status, 206)
  assert.equal(result.headers.get('content-range'), 'bytes 10-12/100')
  assert.equal(result.headers.get('set-cookie'), null)
  assert.equal(await result.text(), 'abc')
})
test('extraction failure returns error code without starting stream fetch', async () => {
  const get = audio(async () => { throw server.classifyYouTubeError('Sign in to confirm you are not a bot') }, () => assert.fail('must not fetch'))
  const result = await get(request())
  assert.equal(result.status, 503)
  assert.equal((await result.json()).code, 'YOUTUBE_AUTH_REQUIRED')
})
test('upstream 403 is not returned as playable audio', async () => {
  const get = audio(async () => JSON.stringify({ url: 'https://media.example/audio' }), async () => new Response('Forbidden', { status: 403 }))
  const result = await get(request())
  assert.equal(result.status, 502)
  assert.equal((await result.json()).code, 'YOUTUBE_STREAM_REJECTED')
})
test('metadata uses oEmbed without running yt-dlp', async () => {
  const { GET } = load('src/app/api/meta/route.ts', { 'next/server': { NextResponse } }, {
    fetch: async url => {
      assert.equal(url.hostname, 'www.youtube.com')
      assert.equal(url.pathname, '/oembed')
      return Response.json({ title: 'Example song', author_name: 'Artist' })
    },
  })
  const result = await GET(request())
  assert.equal(result.status, 200)
  assert.equal((await result.json()).title, 'Example song')
})
