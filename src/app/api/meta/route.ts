import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('v')
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
  }
  try {
    // Titles do not need stream extraction or authenticated cookies.
    const url = new URL('https://www.youtube.com/oembed')
    url.searchParams.set('url', `https://www.youtube.com/watch?v=${videoId}`)
    url.searchParams.set('format', 'json')
    const response = await fetch(url, { signal: AbortSignal.timeout(12000), next: { revalidate: 3600 } })
    if (!response.ok) throw new Error(`Metadata HTTP ${response.status}`)
    const info = await response.json()
    return NextResponse.json({ id: videoId, title: info.title, author: info.author_name || '', duration: 0, thumbnail: info.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` })
  } catch {
    return NextResponse.json({ error: 'Track details are unavailable.' }, { status: 502 })
  }
}
