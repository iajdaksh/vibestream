import { NextRequest, NextResponse } from 'next/server'
import { runYouTube, YouTubeError } from '@/lib/youtube-server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v')
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
  }
  const range = req.headers.get('range')
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) {
    return NextResponse.json({ error: 'Unsupported byte range' }, { status: 416 })
  }
  try {
    const info = JSON.parse(await runYouTube([
      '--no-playlist', '--skip-download', '--dump-single-json',
      '-f', 'bestaudio[ext=m4a][protocol=https]/bestaudio[protocol=https]',
      `https://www.youtube.com/watch?v=${videoId}`,
    ], req.signal))
    if (!info.url) throw new YouTubeError('YOUTUBE_FORMAT_UNAVAILABLE', 'No playable audio stream was returned.')
    const headers = new Headers()
    for (const name of ['User-Agent', 'Referer', 'Origin']) {
      const value = info.http_headers?.[name]
      if (typeof value === 'string') headers.set(name, value)
    }
    if (range) {
      // Bound browser requests such as bytes=0-; YouTube can reject an
      // open-ended media request. The browser requests subsequent chunks
      // using the upstream Content-Range total, which we preserve below.
      const match = /^bytes=(\d+)-(\d*)$/.exec(range)
      if (match) {
        const start = BigInt(match[1])
        const chunkEnd = start + BigInt(1024 * 1024 - 1)
        const requestedEnd = match[2] ? BigInt(match[2]) : chunkEnd
        headers.set('Range', `bytes=${start}-${requestedEnd < chunkEnd ? requestedEnd : chunkEnd}`)
      } else {
        headers.set('Range', range)
      }
    }
    const response = await fetch(info.url, { headers, signal: req.signal, cache: 'no-store' })
    if (!response.ok && response.status !== 416) {
      await response.body?.cancel()
      console.error('[YouTube stream] upstream status:', response.status)
      throw new YouTubeError('YOUTUBE_STREAM_REJECTED', `YouTube rejected the audio stream (HTTP ${response.status}).`)
    }
    const output = new Headers({ 'Cache-Control': 'no-store' })
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const value = response.headers.get(name)
      if (value) output.set(name, value)
    }
    return new NextResponse(response.body, { status: response.status, headers: output })
  } catch (error) {
    const e = error instanceof YouTubeError ? error : new YouTubeError('YOUTUBE_STREAM_FAILED', 'The audio stream could not be loaded.')
    return NextResponse.json({ error: e.message, code: e.code }, { status: e.status, headers: { 'Cache-Control': 'no-store' } })
  }
}
