'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentTheme, parseYouTubeId, Theme } from '@/lib/utils'
import {
  getHistory, clearHistory, HistoryItem,
  getGlobalBass, setGlobalBass,
} from '@/lib/storage'
import type { SearchResult } from '@/app/api/search/route'

type Tab = 'paste' | 'search'

export default function HomePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [theme, setTheme] = useState<Theme | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('paste')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [bass, setBassState] = useState(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const t = getCurrentTheme()
    setTheme(t)
    document.documentElement.style.setProperty('--c-primary', t.primary)
    setHistory(getHistory())
    setBassState(getGlobalBass())
  }, [])

  function goPlay(id: string) {
    router.push(`/play?v=${id}&bass=${bass}`)
  }

  function handleSubmit() {
    const id = parseYouTubeId(url)
    if (!id) { setError('Valid YouTube link dalo! (youtube.com/watch?v=...)'); return }
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
    <main style={{ minHeight: '100vh', background: theme.bg1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.25rem 3rem' }}>

      <div style={{ position: 'absolute', inset: 0, background: theme.gradient, opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="pulse-glow" style={{ width: 68, height: 68, borderRadius: '50%', background: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="11" stroke="#1a0b2e" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="4.5" fill="#1a0b2e" />
              <circle cx="18" cy="18" r="2" fill={theme.primary} />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.02em', background: `linear-gradient(135deg, #fff 0%, ${theme.primary} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: '0.4rem' }}>
            Vibestream
          </h1>
          <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: 'var(--c-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {theme.name} — {theme.vibeHint}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--c-surface)', borderRadius: 12, padding: 4, marginBottom: '1rem', border: '1px solid var(--c-border)' }}>
          {(['paste', 'search'] as Tab[]).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(''); setResults([]) }}
              style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', background: tab === t ? theme.primary : 'transparent', color: tab === t ? '#1a0b2e' : 'var(--c-muted)' }}>
              {t === 'paste' ? '🔗 Paste URL' : '🔍 Search'}
            </button>
          ))}
        </div>

        {/* Paste URL */}
        {tab === 'paste' && (
          <div className="fade-in" style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input type="text" value={url}
                onChange={(e) => { setUrl(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="YouTube link yahan paste karo..."
                style={{ width: '100%', padding: '1rem 1.25rem', paddingRight: 135, background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${error ? '#f87171' : 'var(--c-border)'}`, borderRadius: 14, color: 'var(--c-text)', fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif', outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 4px ${theme.primary}20` }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--c-border)'; e.target.style.boxShadow = 'none' }}
              />
              <button onClick={handleSubmit}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: theme.primary, color: '#1a0b2e', border: 'none', borderRadius: 9, padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif', cursor: 'pointer' }}>
                Let's Vibe ▶
              </button>
            </div>
            {error && <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.5rem', fontFamily: 'Space Mono, monospace' }}>⚠ {error}</p>}
          </div>
        )}

        {/* Search */}
        {tab === 'search' && (
          <div className="fade-in" style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <input type="text" value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Song ya artist ka naam likho..."
                autoFocus
                style={{ width: '100%', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.07)', border: '1.5px solid var(--c-border)', borderRadius: 14, color: 'var(--c-text)', fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif', outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 4px ${theme.primary}20` }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--c-border)'; e.target.style.boxShadow = 'none' }}
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
                      <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)', fontFamily: 'Space Mono, monospace' }}>{r.author} · {Math.floor(r.duration / 60)}:{String(r.duration % 60).padStart(2, '0')}</p>
                    </div>
                    <span style={{ color: theme.primary, fontSize: '1.1rem', flexShrink: 0 }}>▶</span>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: '0.8rem', padding: '1.5rem', fontFamily: 'Space Mono, monospace' }}>Koi result nahi mila 😕</p>
            )}
          </div>
        )}

        {/* Bass Boost */}
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '0.85rem 1.1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
            <span>🔊</span>
            <span style={{ fontSize: '0.72rem', fontFamily: 'Space Mono, monospace', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Global Bass Boost</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontFamily: 'Space Mono, monospace', color: theme.primary }}>{bass >= 0 ? '+' : ''}{bass} dB</span>
          </div>
          <input type="range" min={-6} max={12} step={1} value={bass}
            onChange={(e) => handleBass(Number(e.target.value))}
            style={{ width: '100%', accentColor: theme.primary }} />
        </div>

        {/* Recently Played */}
        {history.length > 0 && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.62rem', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recently Played</p>
              <button onClick={() => { clearHistory(); setHistory([]) }}
                style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '0.65rem', cursor: 'pointer', fontFamily: 'Space Mono, monospace' }}>Clear</button>
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
                    <p style={{ fontSize: '0.7rem', color: 'var(--c-muted)', fontFamily: 'Space Mono, monospace' }}>{h.author}</p>
                  </div>
                  <span style={{ fontSize: '0.58rem', color: 'var(--c-muted)', fontFamily: 'Space Mono, monospace', flexShrink: 0, background: 'var(--c-border)', borderRadius: 6, padding: '2px 6px' }}>{h.vibe}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.58rem', color: 'rgba(255,255,255,0.15)', fontFamily: 'Space Mono, monospace', marginTop: '2rem' }}>
          Uses YouTube API Services · Not affiliated with YouTube/Google
        </p>
      </div>
    </main>
  )
}
