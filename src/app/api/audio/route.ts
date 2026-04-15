import { NextRequest, NextResponse } from 'next/server'
import { ensureYtDlp } from '@/lib/ytdlp-path'
import https from 'https'
import http from 'http'

export const runtime = 'nodejs'
export const maxDuration = 60

// In-memory URL cache (4hr TTL — YouTube URLs expire ~6hr)
const urlCache = new Map<string, { url: string; mimeType: string; expiresAt: number }>()
const CACHE_TTL = 4 * 60 * 60 * 1000

async function getAudioUrl(videoId: string): Promise<{ url: string; mimeType: string }> {
  const cached = urlCache.get(videoId)
  if (cached && cached.expiresAt > Date.now()) return cached

  const YT_DLP_BIN = await ensureYtDlp()
  const { default: YTDlpWrap } = await import('yt-dlp-wrap-extended')
  const ytDlp = new YTDlpWrap(YT_DLP_BIN)

  const info = await ytDlp.getVideoInfo(`https://www.youtube.com/watch?v=${videoId}`)

  const audioFmts = (info.formats as any[]).filter(
    (f) => f.acodec !== 'none' && f.vcodec === 'none' && f.url
  )
  const best =
    audioFmts.find((f) => f.ext === 'webm' && f.abr >= 120) ||
    audioFmts.find((f) => f.ext === 'm4a' || f.ext === 'mp4') ||
    audioFmts[0]

  if (!best?.url) throw new Error('No audio format found')

  const mimeType = best.ext === 'm4a' || best.ext === 'mp4' ? 'audio/mp4' : 'audio/webm'
  const result = { url: best.url, mimeType }
  urlCache.set(videoId, { ...result, expiresAt: Date.now() + CACHE_TTL })
  return result
}

interface ProxyResult {
  stream: ReadableStream<Uint8Array>
  status: number
  headers: Record<string, string>
}

function proxyFetch(upstreamUrl: string, rangeHeader: string | null): Promise<ProxyResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(upstreamUrl)
    const lib = parsed.protocol === 'https:' ? https : http

    const reqHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://www.youtube.com/',
      Origin: 'https://www.youtube.com',
    }

    if (rangeHeader) reqHeaders['Range'] = rangeHeader

    lib
      .get(
        { hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers: reqHeaders },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Upstream ${res.statusCode}`))
            res.resume()
            return
          }

          const outHeaders: Record<string, string> = {}
          if (res.headers['content-length'])
            outHeaders['Content-Length'] = res.headers['content-length'] as string
          if (res.headers['content-range'])
            outHeaders['Content-Range'] = res.headers['content-range'] as string

          const stream = new ReadableStream<Uint8Array>({
            start(controller) {
              res.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
              res.on('end', () => controller.close())
              res.on('error', (err) => controller.error(err))
            },
            cancel() {
              res.destroy()
            },
          })

          resolve({
            stream,
            status: res.statusCode ?? 200,
            headers: outHeaders,
          })
        }
      )
      .on('error', reject)
  })
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v')
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return new NextResponse('Invalid video ID', { status: 400 })
  }

  try {
    const { url, mimeType } = await getAudioUrl(videoId)
    const rangeHeader = req.headers.get('range')

    const { stream, status, headers } = await proxyFetch(url, rangeHeader)

    return new NextResponse(stream, {
      status,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'no-store',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        ...headers,
      },
    })
  } catch (err: any) {
    console.error('[audio proxy]', err?.message)
    return new NextResponse('Failed to load audio: ' + err?.message, { status: 500 })
  }
}