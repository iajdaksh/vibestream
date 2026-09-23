import { execFile } from 'child_process'
import { promisify } from 'util'
import { copyFile, chmod, mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { ensureYtDlp } from './ytdlp-path'

const exec = promisify(execFile)

export class YouTubeError extends Error {
  constructor(public code: string, message: string, public status = 502) {
    super(message)
  }
}

export function classifyYouTubeError(stderr: string): YouTubeError {
  if (/confirm.*not a bot|sign in to confirm/i.test(stderr)) {
    return new YouTubeError('YOUTUBE_AUTH_REQUIRED', 'YouTube blocked playback from this server. A valid server-side YouTube session is required.', 503)
  }
  if (/requested format.*not available|no video formats/i.test(stderr)) {
    return new YouTubeError('YOUTUBE_FORMAT_UNAVAILABLE', 'YouTube did not provide a playable audio stream. Check the server yt-dlp version and JavaScript runtime.')
  }
  if (/private video|video unavailable|has been removed|not available in your country/i.test(stderr)) {
    return new YouTubeError('YOUTUBE_UNAVAILABLE', 'This video is unavailable from the playback server.', 404)
  }
  return new YouTubeError('YOUTUBE_EXTRACTION_FAILED', 'YouTube audio extraction failed. Check the server log for the yt-dlp error.')
}

export async function runYouTube(args: string[], signal?: AbortSignal): Promise<string> {
  let cookieDir: string | undefined
  try {
    if (Number(process.versions.node.split('.')[0]) < 22) {
      throw new YouTubeError('YOUTUBE_RUNTIME', 'The playback server requires Node.js 22 or newer.', 503)
    }
    const bin = await ensureYtDlp()
    const common = ['--ignore-config', '--no-cache-dir', '--no-colors', '--js-runtimes', `node:${process.execPath}`, '--socket-timeout', '15', '--retries', '1', '--extractor-retries', '1']
    // yt-dlp writes its cookie jar on exit. Keep mounted secrets read-only
    // and concurrent requests isolated using private temporary copies.
    if (process.env.YTDLP_COOKIES_FILE) {
      cookieDir = await mkdtemp(path.join(tmpdir(), 'vibestream-cookies-'))
      const jar = path.join(cookieDir, 'cookies.txt')
      await copyFile(process.env.YTDLP_COOKIES_FILE, jar)
      await chmod(jar, 0o600)
      common.push('--cookies', jar)
    }
    const { stdout } = await exec(bin, [...common, ...args], {
      timeout: 45000, maxBuffer: 8 * 1024 * 1024, windowsHide: true, signal,
    })
    return stdout
  } catch (error) {
    if (error instanceof YouTubeError) throw error
    const e = error as Error & { stderr?: string; code?: string; killed?: boolean }
    // Never log the command, cookie paths, or signed media URLs.
    const detail = (e.stderr || e.message).replace(/https?:\/\/\S+/g, '[URL]').slice(-6000)
    console.error('[YouTube extraction]', e.stderr ? detail : e.code || e.name)
    if (e.code === 'ENOENT' || e.code === 'EACCES') {
      throw new YouTubeError('YOUTUBE_SERVER_CONFIG', 'Playback server setup is incomplete. Check the executable and configured cookie file.', 503)
    }
    if (e.killed || e.name === 'AbortError') {
      throw new YouTubeError('YOUTUBE_TIMEOUT', 'YouTube audio extraction timed out or was cancelled.', 504)
    }
    throw classifyYouTubeError(e.stderr || e.message)
  } finally {
    if (cookieDir) await rm(cookieDir, { recursive: true, force: true })
  }
}
