/**
 * Downloads the yt-dlp binary for the current platform at build/install time.
 * Runs automatically via "postinstall" in package.json.
 * Skips download if the binary already exists.
 */

import { createWriteStream, existsSync, chmodSync } from 'fs'
import { get } from 'https'
import { join } from 'path'

const isWin = process.platform === 'win32'
const isMac = process.platform === 'darwin'

const BIN_NAME = isWin ? 'yt-dlp.exe' : 'yt-dlp'
const BIN_PATH = join(process.cwd(), BIN_NAME)

const DOWNLOAD_URL = isWin
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : isMac
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

if (existsSync(BIN_PATH)) {
  console.log(`[setup-yt-dlp] Binary already exists at ${BIN_PATH}, skipping.`)
  process.exit(0)
}

console.log(`[setup-yt-dlp] Downloading yt-dlp for ${process.platform}...`)

function download(url) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      // Follow redirects (GitHub releases use 302)
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`))
      }
      const file = createWriteStream(BIN_PATH)
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
      file.on('error', reject)
    }).on('error', reject)
  })
}

try {
  await download(DOWNLOAD_URL)
  if (!isWin) chmodSync(BIN_PATH, '755')
  console.log(`[setup-yt-dlp] Downloaded to ${BIN_PATH}`)
} catch (err) {
  console.error(`[setup-yt-dlp] Download failed: ${err.message}`)
  console.error('[setup-yt-dlp] Binary will be downloaded at runtime to /tmp instead.')
  // Don't exit(1) — Vercel runtime will download to /tmp as fallback
}
