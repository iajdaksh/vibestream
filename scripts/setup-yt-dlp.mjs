/** Install at npm install; refresh on each production build. */
import { createWriteStream, existsSync } from 'node:fs'
import { chmod, rename, rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const binPath = join(process.cwd(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
const refresh = process.argv.includes('--refresh')
if (existsSync(binPath) && !refresh) process.exit(0)

const asset = process.platform === 'win32' ? 'yt-dlp.exe'
  : process.platform === 'darwin' ? 'yt-dlp_macos'
  : process.arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux'
const staging = `${binPath}.download${process.platform === 'win32' ? '.exe' : ''}`
try {
  const response = await fetch(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`, {
    signal: AbortSignal.timeout(120000),
  })
  if (!response.ok || !response.body) throw new Error(`Download HTTP ${response.status}`)
  await pipeline(Readable.fromWeb(response.body), createWriteStream(staging))
  if (process.platform !== 'win32') await chmod(staging, 0o755)
  const version = execFileSync(staging, ['--version'], { encoding: 'utf8', timeout: 15000, windowsHide: true }).trim()
  await rename(staging, binPath)
  console.log(`[setup-yt-dlp] Installed ${version} (${asset})`)
} catch (error) {
  console.error(`[setup-yt-dlp] Installation failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await rm(staging, { force: true })
}
