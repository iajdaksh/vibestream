'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Icon from '@/components/Icon'
import Brand from '@/components/Brand'
import Footer from '@/components/Footer'
import { useRouter } from 'next/navigation'
import { parseYouTubeId } from '@/lib/utils'
import { useTimeTheme } from '@/lib/useTimeTheme'
import {
  getHistory, clearHistory, HistoryItem,
  getGlobalBass, setGlobalBass,
} from '@/lib/storage'
import type { SearchResult } from '@/app/api/search/route'

type Tab = 'paste' | 'search'

export default function HomePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const theme = useTimeTheme()
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('paste')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [bass, setBassState] = useState(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setHistory(getHistory())
    setBassState(getGlobalBass())
  }, [])

  useEffect(() => {
    if (theme) document.documentElement.style.setProperty('--c-primary', theme.primary)
  }, [theme])

  function goPlay(id: string) {
    router.push(`/play?v=${id}&bass=${bass}`)
  }

  function handleSubmit() {
    const id = parseYouTubeId(url)
    if (!id) { setError('Paste a Valid YouTube link! (youtube.com/watch?v=...)'); return }
    setError('')
    goPlay(id)
  }

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch { setResults([]) }
    finally { setSearching(false) }
  }, [])

  function handleQueryChange(val: string) {
    setQuery(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(val), 500)
  }

  function handleBass(val: number) {
    setBassState(val)
    setGlobalBass(val)
  }

  if (!theme) return null

  return (
    <main className="home-shell" style={{ background: theme.bg1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <div style={{ position: 'absolute', inset: 0, background: theme.gradient, opacity: 0.12, pointerEvents: 'none', zIndex: 0 }} />

      <div className="home-content" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 640 }}>

        <Brand />
        <nav className="home-navigation" aria-label="PlayRadio links">
          <a href="https://playradio.buzz" aria-label="PlayRadio home" title="PlayRadio home">
            <Icon name="home" size={20} />
          </a>
          <a href="https://playradio.buzz/support" aria-label="Support us" title="Support us">
            <Icon name="support" size={20} />
          </a>
        </nav>
        <div className="home-workspace">
        {/* Logo */}
        <header className="home-hero">
          <p className="eyebrow"><span className="station-dot" /> YOUR OWN FREQUENCY</p>
          <h1>Find your <em>vibe.</em></h1>
          <p className="hero-copy">A song for the moment. A mood of your own.</p>
          <p className="time-theme">{theme.name} / {theme.vibeHint}</p>
        </header>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--c-surface)', borderRadius: 12, padding: 4, marginBottom: '1rem', border: '1px solid var(--c-border)' }}>
          {(['paste', 'search'] as Tab[]).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(''); setResults([]) }}
              style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', background: tab === t ? theme.primary : 'transparent', color: tab === t ? '#0e0b09' : 'var(--c-muted)' }}>
              <Icon name={t === 'paste' ? 'link' : 'search'} size={16} /> {t === 'paste' ? 'Paste URL' : 'Search'}
            </button>
          ))}
        </div>

        {/* Paste URL */}
        {tab === 'paste' && (
          <div className="fade-in" style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input className="track-input" aria-label="YouTube link" aria-invalid={!!error} type="text" value={url}
                onChange={(e) => { setUrl(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Paste YouTube link here..."
                style={{ width: '100%', padding: '1rem 1.25rem', paddingRight: 135, background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${error ? '#f87171' : 'var(--c-border)'}`, borderRadius: 14, color: 'var(--c-text)', fontSize: '0.95rem', fontFamily: 'var(--font-body)', outline: 'none' }}
              />
              <button onClick={handleSubmit}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: theme.primary, color: '#0e0b09', border: 'none', borderRadius: 9, padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                Let's Vibe <Icon name="play" size={14} />
              </button>
            </div>
            {error && <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}><Icon name="alert" size={15} /> {error}</p>}
          </div>
        )}

        {/* Search */}
        {tab === 'search' && (
          <div className="fade-in" style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <input className="track-input" aria-label="Search songs or artists" type="text" value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Write a Song Name or An Artist.."
                autoFocus
                style={{ width: '100%', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.07)', border: '1.5px solid var(--c-border)', borderRadius: 14, color: 'var(--c-text)', fontSize: '0.95rem', fontFamily: 'var(--font-body)', outline: 'none' }}
              />
              {searching && (
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, border: `2px solid ${theme.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'vinyl-spin 0.6s linear infinite' }} />
              )}
            </div>

            {results.length > 0 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map((r) => (
                  <button key={r.id} onClick={() => goPlay(r.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.background = `${theme.primary}12` }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = 'var(--c-surface)' }}>
                    <img src={r.thumbnail} alt="" style={{ width: 52, height: 38, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>{r.author} · {Math.floor(r.duration / 60)}:{String(r.duration % 60).padStart(2, '0')}</p>
                    </div>
                    <span style={{ color: theme.primary, fontSize: '1.1rem', flexShrink: 0 }}><Icon name="play" /></span>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: '0.8rem', padding: '1.5rem', fontFamily: 'var(--font-mono)' }}><Icon name="search" /> No tracks found. Try another search.</p>
            )}
          </div>
        )}

        {/* Recently Played */}
        {history.length > 0 && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recently Played</p>
              <button onClick={() => { clearHistory(); setHistory([]) }}
                style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '0.65rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>Clear</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.slice(0, 6).map((h) => (
                <button key={h.id + h.playedAt} onClick={() => goPlay(h.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '9px 12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)' }}>
                  {h.thumbnail
                    ? <img src={h.thumbnail} alt="" style={{ width: 44, height: 33, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 44, height: 33, borderRadius: 6, background: 'var(--c-border)', flexShrink: 0 }} />
                  }
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--c-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>{h.author}</p>
                  </div>
                  <span style={{ fontSize: '0.58rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, background: 'var(--c-border)', borderRadius: 6, padding: '2px 6px' }}>{h.vibe}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        </div>
        {/* Bass Boost */}
        <div style={{ flexShrink: 0, padding: '12px 4px 8px', background: 'transparent', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
            <Icon name="volume" />
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Global Bass Boost</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: theme.primary }}>{bass >= 0 ? '+' : ''}{bass} dB</span>
          </div>
          <input aria-label="Global bass boost" type="range" min={-6} max={12} step={1} value={bass}
            onChange={(e) => handleBass(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.primary }} />
        </div>
        <Footer />
      </div>
    </main>
  )
}
