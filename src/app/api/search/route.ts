import { NextRequest, NextResponse } from 'next/server'
import { runYouTube, YouTubeError } from '@/lib/youtube-server'

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
    const out = await runYouTube([
      `ytsearch5:${q}`,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings'
    ], req.signal)
    
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
  } catch (err) {
    const e = err instanceof YouTubeError ? err : new YouTubeError('YOUTUBE_SEARCH_FAILED', 'Search is unavailable.')
    return NextResponse.json({ results: [], error: e.message, code: e.code }, { status: e.status })
  }
}
