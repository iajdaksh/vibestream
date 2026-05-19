import { NextRequest, NextResponse } from 'next/server'
import { ensureYtDlp } from '@/lib/ytdlp-path'
import YTDlpWrap from 'yt-dlp-wrap-extended'

export const runtime = 'nodejs'
export const maxDuration = 60

export interface SearchResult {
  id: string
  title: string
  author: string
  duration: number
  thumbnail: string
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const binPath = await ensureYtDlp()
    const ytDlp = new YTDlpWrap(binPath)
    
    const out = await ytDlp.execPromise([
      `ytsearch5:${q}`,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings'
    ])
    
    const results = out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try {
          const item = JSON.parse(line)
          return {
            id: item.id,
            title: item.title,
            author: item.uploader || item.channel || 'Unknown',
            duration: item.duration || 0,
            thumbnail: item.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
          } as SearchResult
        } catch {
          return null
        }
      })
      .filter(Boolean)

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ results: [], error: err?.message }, { status: 500 })
  }
}
