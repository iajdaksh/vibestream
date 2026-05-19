import path from 'path'
import { existsSync, chmodSync } from 'fs'
import { get } from 'https'

const TMP_BIN = '/tmp/yt-dlp'
const DOWNLOAD_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

export async function ensureYtDlp(): Promise<string> {
  // Windows dev environment
  if (process.platform === 'win32') {
    return path.join(process.cwd(), 'yt-dlp.exe')
  }

  // Check all candidate paths (covers local dev + Vercel Lambda layouts)
  const candidates = [
    path.join(process.cwd(), 'yt-dlp'),
    '/var/task/yt-dlp',
    TMP_BIN,
  ]

  for (const p of candidates) {
    if (existsSync(p)) {
      console.log('[yt-dlp] Found binary at', p)
      return p
    }
  }

  // Last resort: download to /tmp (Vercel Lambda writable dir)
  console.log('[yt-dlp] Binary not found in any candidate path — downloading to /tmp...')
  await downloadBin(DOWNLOAD_URL, TMP_BIN)
  chmodSync(TMP_BIN, '755')
  console.log('[yt-dlp] Downloaded successfully to', TMP_BIN)
  return TMP_BIN
}

function downloadBin(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createWriteStream } = require('fs')
    get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBin(res.headers.location!, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`[yt-dlp] HTTP ${res.statusCode} from ${url}`))
      }
      const file = createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => file.close(resolve as any))
      file.on('error', reject)
    }).on('error', reject)
  })
}