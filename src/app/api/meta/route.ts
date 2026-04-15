import { NextRequest, NextResponse } from 'next/server'
import { ensureYtDlp } from '@/lib/ytdlp-path'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v')
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
  }

  try {
    const YT_DLP_BIN = await ensureYtDlp()
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