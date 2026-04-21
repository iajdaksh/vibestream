import { existsSync, chmodSync, copyFileSync } from 'fs'
import { get } from 'https'
import { createWriteStream } from 'fs'
import path from 'path'

const IS_WIN = process.platform === 'win32'
const TMP_BIN = '/tmp/yt-dlp'
const BUNDLED_BIN = path.join(
  process.cwd(),
  IS_WIN ? 'yt-dlp.exe' : 'yt-dlp'
)

let ensured: string | null = null

function downloadBin(dest: string): Promise<void> {
  const url =
    'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

  return new Promise((resolve, reject) => {
    function fetch(u: string) {
      get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetch(res.headers.location!)
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`))
        }
        const file = createWriteStream(dest)
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve()))
        file.on('error', reject)
      }).on('error', reject)
    }
    fetch(url)
  })
}

// Returns a path to a runnable yt-dlp binary.
// On Vercel/Lambda, copies the bundled binary to /tmp so it can be chmod'd.
export async function ensureYtDlp(): Promise<string> {
  if (ensured) return ensured

  // Windows: bundled binary is directly usable
  if (IS_WIN) {
    ensured = BUNDLED_BIN
    return ensured
  }

  // Already prepared in this container
  if (existsSync(TMP_BIN)) {
    ensured = TMP_BIN
    return ensured
  }

  // Copy bundled binary to /tmp and make it executable
  if (existsSync(BUNDLED_BIN)) {
    copyFileSync(BUNDLED_BIN, TMP_BIN)
    chmodSync(TMP_BIN, '755')
    ensured = TMP_BIN
    return ensured
  }

  // Last resort: download at runtime (slow cold start, but works)
  console.warn('[yt-dlp] bundled binary not found, downloading to /tmp...')
  await downloadBin(TMP_BIN)
  chmodSync(TMP_BIN, '755')
  ensured = TMP_BIN
  return ensured
}
