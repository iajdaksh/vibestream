import { NextRequest, NextResponse } from 'next/server'
import { ensureYtDlp } from '@/lib/ytdlp-path'
import YTDlpWrap from 'yt-dlp-wrap-extended'

export const runtime = 'nodejs'
// Allow longer duration if on pro plan, but hobby is max 10/60
export const maxDuration = 60 

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v')
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return new NextResponse('Invalid video ID', { status: 400 })
  }

  try {
    const binPath = await ensureYtDlp()
    const ytDlp = new YTDlpWrap(binPath)
    
    // Get info quickly
    const info = await ytDlp.getVideoInfo(`https://www.youtube.com/watch?v=${videoId}`)
    
    // Find best audio format
    const format = info.formats
      .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0] || info.formats[0];

    if (!format || !format.url) {
      return new NextResponse('Audio stream not found', { status: 404 })
    }

    const audioUrl = format.url

    // Proxy the request to bypass CORS
    const range = req.headers.get('range') || 'bytes=0-'
    
    const response = await fetch(audioUrl, {
      headers: {
        'Range': range,
      }
    })

    const newHeaders = new Headers(response.headers)
    newHeaders.set('Access-Control-Allow-Origin', '*')
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: newHeaders,
    })

  } catch (err: any) {
    console.error('[Audio Route Error]', err)
    return new NextResponse(err?.message || 'Internal Server Error', { status: 500 })
  }
}
