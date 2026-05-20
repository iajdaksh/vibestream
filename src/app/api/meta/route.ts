import { NextRequest, NextResponse } from 'next/server'
import YTDlpWrap from 'yt-dlp-wrap-extended'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v')
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
  }

  try {
    const binPath = path.join(process.cwd(), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
    
    if (!fs.existsSync(binPath)) {
      throw new Error(`YT-DLP missing at ${binPath}. Check Render Build Command!`)
    }

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
    console.error('[Meta Route Error]:', err);
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
