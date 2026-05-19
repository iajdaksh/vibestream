import { NextRequest, NextResponse } from 'next/server'
import { ensureYtDlp } from '@/lib/ytdlp-path'
import YTDlpWrap from 'yt-dlp-wrap-extended'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v')
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
  }

  try {
    const binPath = await ensureYtDlp()
    const ytDlp = new YTDlpWrap(binPath)
    
    const info = await ytDlp.getVideoInfo(`https://www.youtube.com/watch?v=${videoId}`)

    return NextResponse.json({
      id: videoId,
      title: info.title,
      author: info.uploader || info.channel || 'Unknown',
      duration: info.duration || 0,
      thumbnail: info.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
