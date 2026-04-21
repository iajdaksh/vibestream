import { NextRequest, NextResponse } from 'next/server'
import { ensureYtDlp } from '@/lib/yt-dlp'

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
    const { default: YTDlpWrap } = await import('yt-dlp-wrap-extended')
    const ytDlp = new YTDlpWrap(binPath)

    const raw: string = await ytDlp.execPromise([
      `ytsearch6:${q}`,
      '--dump-json',
      '--no-playlist',
      '--no-download',
      '--quiet',
    ])

    const results: SearchResult[] = raw
      .split('\n')
      .filter(Boolean)
      .slice(0, 6)
      .map((line) => {
        try {
          const item = JSON.parse(line)
          return {
            id: item.id,
            title: item.title,
            author: item.uploader || item.channel || '',
            duration: item.duration || 0,
            thumbnail:
              item.thumbnail ||
              item.thumbnails?.at(-1)?.url ||
              `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
          }
        } catch {
          return null
        }
      })
      .filter(Boolean) as SearchResult[]

    return NextResponse.json({ results })
  } catch (err: any) {
    console.error('[search error]', err?.message)
    return NextResponse.json({ results: [], error: err?.message }, { status: 500 })
  }
}
