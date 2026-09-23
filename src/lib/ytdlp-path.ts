import path from 'path'
import { access } from 'fs/promises'
import { constants } from 'fs'

export async function ensureYtDlp(): Promise<string> {
  const bin = process.env.YTDLP_PATH || path.join(process.cwd(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
  await access(bin, process.platform === 'win32' ? constants.F_OK : constants.X_OK)
  return bin
}
