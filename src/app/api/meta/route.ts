import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 60

const YT_DLP_BIN = process.platform === 'win32'
  ? path.join(process.cwd(), 'yt-dlp.exe')
  : path.join(process.cwd(), 'yt-dlp')

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v')
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
  }

  try {
    const { default: YTDlpWrap } = await import('yt-dlp-wrap-extended')
    const ytDlp = new YTDlpWrap(YT_DLP_BIN)
    const info = await ytDlp.getVideoInfo(
      `https://www.youtube.com/watch?v=${videoId}`
    )

    return NextResponse.json({
      title: info.title ?? 'Unknown Track',
      author: info.uploader ?? info.channel ?? '',
      duration: info.duration ?? 0,
      thumbnail: info.thumbnail ?? '',
    })
  } catch (err: any) {
    console.error('[meta error]', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
