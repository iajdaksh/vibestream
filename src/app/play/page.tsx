'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Icon from '@/components/Icon'
import Brand from '@/components/Brand'
import Footer from '@/components/Footer'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatTime, vibeConfigs, parseYouTubeId } from '@/lib/utils'
import { useTimeTheme } from '@/lib/useTimeTheme'
import { VibeAudioEngine, VibeId, CustomParams } from '@/lib/vibeAudio'
import {
  addToHistory, getPresets, savePreset, deletePreset, VibePreset,
  getQueue, saveQueue, QueueItem, getGlobalBass,
} from '@/lib/storage'
import EQVisualizer from '@/components/EQVisualizer'
import Vinyl from '@/components/Vinyl'
import VibeBackground from '@/components/VibeBackground'

// ── Vibe card generator ───────────────────────────────────────────────────────
function generateVibeCard(
  title: string, author: string, vibe: string,
  primaryColor: string, bg: string,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = 800; canvas.height = 800
  const ctx = canvas.getContext('2d')!

  // Background
  const grad = ctx.createRadialGradient(400, 300, 0, 400, 400, 600)
  grad.addColorStop(0, bg)
  grad.addColorStop(1, '#000')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 800, 800)

  // Glow circle
  const glow = ctx.createRadialGradient(400, 380, 0, 400, 380, 280)
  glow.addColorStop(0, primaryColor + '40')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 800, 800)

  // Vinyl record
  ctx.save()
  ctx.translate(400, 360)
  ctx.beginPath(); ctx.arc(0, 0, 200, 0, Math.PI * 2)
  ctx.fillStyle = '#111'; ctx.fill()
  for (const r of [170, 155, 140, 125, 110, 95]) {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2; ctx.stroke()
  }
  ctx.beginPath(); ctx.arc(0, 0, 65, 0, Math.PI * 2)
  ctx.fillStyle = '#211910'; ctx.fill()
  ctx.beginPath(); ctx.arc(0, 0, 64, 0, Math.PI * 2)
  ctx.strokeStyle = primaryColor + '60'; ctx.lineWidth = 2; ctx.stroke()
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2)
  ctx.fillStyle = '#000'; ctx.fill()
  ctx.restore()

  // Title
  ctx.font = 'bold 32px Georgia, serif'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  const words = title.split(' ')
  let line = ''; const lines: string[] = []; const maxW = 680
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w }
    else line = test
  }
  lines.push(line)
  const titleY = 610
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 400, titleY + i * 40))

  // Author
  ctx.font = '20px sans-serif'
  ctx.fillStyle = primaryColor + 'CC'
  ctx.fillText(author, 400, titleY + Math.min(lines.length, 2) * 40 + 28)

  // Vibe badge
  ctx.font = 'bold 16px sans-serif'
  ctx.fillStyle = '#0e0b09'
  const badgeText = vibe.toUpperCase() + ' MODE'
  const bw = ctx.measureText(badgeText).width + 32
  const bx = 400 - bw / 2; const by = titleY + Math.min(lines.length, 2) * 40 + 68
  ctx.fillStyle = primaryColor
  ctx.beginPath(); ctx.roundRect(bx, by, bw, 30, 15); ctx.fill()
  ctx.fillStyle = '#0e0b09'
  ctx.fillText(badgeText, 400, by + 20)

  // Branding
  ctx.font = 'bold 20px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillText('VIBE / PLAYRADIO.BUZZ', 400, 764)

  return canvas.toDataURL('image/png')
}

// ── Player ────────────────────────────────────────────────────────────────────
function PlayerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v')
  const initialVibe = (searchParams.get('vibe') || 'normal') as VibeId
  const initialBassParam = Number(searchParams.get('bass') || '0')

  const baseTheme = useTimeTheme()
  const [vibe, setVibeState] = useState<VibeId>(initialVibe)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [trackTitle, setTrackTitle] = useState('')
  const [trackAuthor, setTrackAuthor] = useState('')
  const [trackThumb, setTrackThumb] = useState('')
  const [loading, setLoading] = useState(true)
  const [audioError, setAudioError] = useState(false)
  const [toast, setToast] = useState({ show: false, msg: '' })
  const [showCustom, setShowCustom] = useState(false)
  const [showVibes, setShowVibes] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [loop, setLoop] = useState(false)
  const [queueUrl, setQueueUrl] = useState('')
  const [queueAdding, setQueueAdding] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presets, setPresets] = useState<VibePreset[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  // Custom params
  const [customSpeed, setCustomSpeed] = useState(100)
  const [customReverb, setCustomReverb] = useState(0)
  const [customLowpass, setCustomLowpass] = useState(20000)
  const [customBass, setCustomBass] = useState(0)

  // Global bass from home page
  const globalBassRef = useRef(initialBassParam || getGlobalBass())

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const engineRef = useRef<VibeAudioEngine | null>(null)
  const engineReady = useRef(false)
  const vibeRef = useRef<VibeId>(initialVibe)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentVibe = vibeConfigs[vibe] || vibeConfigs.normal
  const theme = baseTheme ? { ...baseTheme, primary: vibe === 'custom' ? '#FB923C' : vibe !== 'normal' ? currentVibe.statusColor : baseTheme.primary } : null
  useEffect(() => {
    if (theme) document.documentElement.style.setProperty('--c-primary', theme.primary)
  }, [theme?.primary])
  const playbackRate = vibe === 'custom' ? customSpeed / 100 : currentVibe.rate

  // ── theme + init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) { router.push('/'); return }
    setPresets(getPresets())
    setQueue(getQueue())
  }, [videoId, router])

  // ── metadata ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) return
    fetch(`/api/meta?v=${videoId}`)
      .then(async r => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed to fetch meta')
        return d
      })
      .then(d => {
        setTrackTitle(d.title || 'Unknown Track')
        setTrackAuthor(d.author || '')
        setTrackThumb(d.thumbnail || '')
        if (d.duration) setDuration(d.duration)
      }).catch((err) => {
        console.error("Meta fetch error:", err)
        showToast(err.message)
        setTrackTitle('YouTube Track')
      })
  }, [videoId])

  // ── audio element ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) return
    setLoading(true)
    setAudioError(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.src = `/api/audio?v=${videoId}`
    audio.preload = 'auto'
    audioRef.current = audio
    engineRef.current = new VibeAudioEngine()

    const onCanPlay = () => { setLoading(false) }
    const onError = () => { setLoading(false); setAudioError(true) }
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => { if (audio.duration) setDuration(audio.duration) }
    const onEnded = () => { setIsPlaying(false); stopProgress(); playNext() }
    const onPause = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)

    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('error', onError)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)

    return () => {
      audio.pause()
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
      audio.src = ''
      engineRef.current?.destroy()
      engineReady.current = false
      if (progressTimer.current) clearInterval(progressTimer.current)
    }
  }, [videoId])

  // sync playback rate
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  // sync loop
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop
  }, [loop])

  // ── helpers ─────────────────────────────────────────────────────────────────
  function stopProgress() {
    if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null }
  }

  function showToast(msg: string) {
    setToast({ show: true, msg })
    clearTimeout(toastTimer.current ?? undefined)
    toastTimer.current = setTimeout(() => setToast({ show: false, msg: '' }), 2500)
  }

  async function initEngine() {
    if (engineReady.current || !audioRef.current || !engineRef.current) return
    try {
      await engineRef.current.init(audioRef.current)
      engineReady.current = true
      setAnalyser(engineRef.current.getAnalyser())
    } catch (e) { console.warn('[engine init]', e) }
  }

  function customParams(): CustomParams {
    return { speed: customSpeed, reverb: customReverb, lowpass: customLowpass, bass: customBass + globalBassRef.current }
  }

  async function applyVibe(v: VibeId) {
    await initEngine()
    if (!engineRef.current || !engineReady.current) return
    if (v === 'custom') engineRef.current.updateCustom(customParams())
    else engineRef.current.setVibe(v)
  }

  // ── play / pause ─────────────────────────────────────────────────────────────
  async function togglePlay() {
    const audio = audioRef.current
    if (!audio || loading || audioError) return
    if (isPlaying) {
      audio.pause(); stopProgress()
    } else {
      await applyVibe(vibeRef.current)
      audio.playbackRate = playbackRate
      await audio.play().catch(e => console.warn('[play]', e))
      progressTimer.current = setInterval(() => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
      }, 300)
      // Save to history once playing starts
      if (trackTitle) {
        addToHistory({ id: videoId!, title: trackTitle, author: trackAuthor, thumbnail: trackThumb, vibe })
      }
    }
  }

  // ── seek ─────────────────────────────────────────────────────────────────────
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  // ── vibe change ───────────────────────────────────────────────────────────────
  const handleVibeChange = useCallback(async (v: VibeId) => {
    setVibeState(v); vibeRef.current = v
    setShowCustom(v === 'custom')
    await applyVibe(v)
    if (audioRef.current) {
      const cfg = vibeConfigs[v]
      audioRef.current.playbackRate = v === 'custom' ? customSpeed / 100 : (cfg?.rate ?? 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customSpeed])

  // ── custom sliders ────────────────────────────────────────────────────────────
  function handleCustomSpeed(val: number) {
    setCustomSpeed(val)
    if (audioRef.current) audioRef.current.playbackRate = val / 100
  }
  function handleCustomReverb(val: number) {
    setCustomReverb(val)
    engineRef.current?.updateCustom({ speed: customSpeed, reverb: val, lowpass: customLowpass, bass: customBass + globalBassRef.current })
  }
  function handleCustomLowpass(val: number) {
    setCustomLowpass(val)
    engineRef.current?.updateCustom({ speed: customSpeed, reverb: customReverb, lowpass: val, bass: customBass + globalBassRef.current })
  }
  function handleCustomBass(val: number) {
    setCustomBass(val)
    engineRef.current?.updateCustom({ speed: customSpeed, reverb: customReverb, lowpass: customLowpass, bass: val + globalBassRef.current })
  }

  // ── presets ────────────────────────────────────────────────────────────────
  function handleSavePreset() {
    if (!presetName.trim()) return
    const p = savePreset({ name: presetName.trim(), speed: customSpeed, reverb: customReverb, lowpass: customLowpass, bass: customBass })
    setPresets(getPresets())
    setPresetName('')
    showToast(`"${p.name}" save ho gaya!`)
  }
  function handleLoadPreset(p: VibePreset) {
    setCustomSpeed(p.speed); setCustomReverb(p.reverb)
    setCustomLowpass(p.lowpass); setCustomBass(p.bass)
    engineRef.current?.updateCustom({ speed: p.speed, reverb: p.reverb, lowpass: p.lowpass, bass: p.bass + globalBassRef.current })
    if (audioRef.current) audioRef.current.playbackRate = p.speed / 100
    showToast(`"${p.name}" load ho gaya!`)
  }
  function handleDeletePreset(id: string) {
    deletePreset(id); setPresets(getPresets())
  }

  // ── queue ──────────────────────────────────────────────────────────────────
  function playNext() {
    const q = getQueue()
    if (!q.length) return
    const [next, ...rest] = q
    saveQueue(rest)
    router.push(`/play?v=${next.id}&vibe=${vibeRef.current}`)
  }
  function addToQueue(item: QueueItem) {
    const q = [...queue, item]; setQueue(q); saveQueue(q)
    showToast(`Queue mein add ho gaya!`)
  }
  function removeFromQueue(idx: number) {
    const q = queue.filter((_, i) => i !== idx); setQueue(q); saveQueue(q)
  }

  // ── vibe card ──────────────────────────────────────────────────────────────
  function handleShareCard() {
    if (!theme) return
    const dataUrl = generateVibeCard(trackTitle || 'Vibe by PlayRadio', trackAuthor, vibe, theme.primary, theme.bg1)
    const a = document.createElement('a')
    a.href = dataUrl; a.download = 'vibecard.png'; a.click()
    showToast('Vibe card download ho gaya!')
  }

  // ── share link ──────────────────────────────────────────────────────────────
  function shareLink() {
    const url = `${window.location.origin}/play?v=${videoId}&vibe=${vibe}&t=${Math.floor(currentTime)}`
    navigator.clipboard.writeText(url).then(() => showToast('Link copy ho gaya!'))
      .catch(() => showToast('Copy failed'))
  }

  // ── queue add by URL ──────────────────────────────────────────────────────
  async function handleAddUrlToQueue() {
    const id = parseYouTubeId(queueUrl.trim())
    if (!id) { showToast('Valid YouTube link dalo!'); return }
    setQueueAdding(true)
    try {
      const res = await fetch(`/api/meta?v=${id}`)
      const d = await res.json()
      if (d.error) { showToast('Song info nahi mila'); return }
      addToQueue({ id, title: d.title, author: d.author, thumbnail: d.thumbnail })
      setQueueUrl('')
    } catch { showToast('Error aayi, try again') }
    finally { setQueueAdding(false) }
  }

  // ── timestamp seek from URL ──────────────────────────────────────────────
  useEffect(() => {
    const t = parseInt(searchParams.get('t') || '0')
    if (t > 0 && audioRef.current) audioRef.current.currentTime = t
  }, [searchParams])

  if (!theme || !videoId) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const vibeList = [...Object.values(vibeConfigs), { id: 'custom', label: 'Custom', statusLabel: '', rate: 1, statusColor: '', icon: 'custom' as const }]

  return (
    <main className="player-shell" data-playing={isPlaying} style={{ background: theme.bg1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* BG */}
      <div style={{ position: 'absolute', inset: 0, background: theme.gradient, opacity: isPlaying ? 0.3 : 0.1, transition: 'opacity 1s', pointerEvents: 'none', zIndex: 0 }} />
      <VibeBackground vibe={vibe} isPlaying={isPlaying} />

      <div className="player-content" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Brand />

        {/* Header */}
        <div className="player-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem 0.75rem' }}>
          <button title="Back to home" aria-label="Back to home" onClick={() => router.push('/')}
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 10, color: 'var(--c-text)', padding: '8px 14px', fontSize: '0.82rem', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            <Icon name="back" size={18} />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Now Playing
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button aria-expanded={showQueue} title="Open queue" aria-label="Open queue" onClick={() => setShowQueue(q => !q)}
              style={{ background: showQueue ? theme.primary : 'var(--c-surface)', border: `1px solid ${showQueue ? theme.primary : 'var(--c-border)'}`, borderRadius: 10, color: showQueue ? '#0e0b09' : 'var(--c-text)', padding: '8px 12px', fontSize: '0.82rem', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
              <Icon name="queue" />
            </button>
            <button title="Copy track link" aria-label="Copy track link" onClick={shareLink}
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 10, color: 'var(--c-text)', padding: '8px 12px', fontSize: '0.82rem', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
              <Icon name="link" />
            </button>
          </div>
        </div>

        {/* Vinyl + info */}
        <div className="playback-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.25rem 1.25rem', flex: 1 }}>

          <div className="record-art">
          {/* Skeleton or Vinyl */}
          {loading ? (
            <div style={{ width: 200, height: 200, borderRadius: '50%', marginBottom: '1rem' }} className="skeleton" />
          ) : (
            <Vinyl isPlaying={isPlaying} playbackRate={playbackRate} vibeLabel={vibe} primaryColor={theme.primary} />
          )}

          </div>
          {/* Track info */}
          <div className="track-info" style={{ textAlign: 'center', marginBottom: '0.75rem', width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: '0.4rem' }}>
              {!loading && <div className={isPlaying ? 'blink-dot' : undefined} style={{ width: 7, height: 7, borderRadius: '50%', background: theme.primary }} />}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--c-muted)', letterSpacing: '0.08em' }}>
                {loading ? 'Loading audio...' : vibe === 'custom' ? 'CUSTOM VIBE' : currentVibe.statusLabel}
              </span>
            </div>

            {loading ? (
              <>
                <div className="skeleton" style={{ height: 20, width: '80%', margin: '0 auto 8px' }} />
                <div className="skeleton" style={{ height: 14, width: '50%', margin: '0 auto' }} />
              </>
            ) : audioError ? (
              <p style={{ color: '#f87171', fontSize: '0.9rem' }}><Icon name="alert" /> Can't Load Audio</p>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {trackTitle || 'Loading...'}
                </h2>
                {trackAuthor && <p style={{ fontSize: '0.82rem', color: 'var(--c-muted)' }}>{trackAuthor}</p>}
              </>
            )}
          </div>

          {/* EQ Visualizer */}
          <div className="player-eq" style={{ marginBottom: '0.75rem' }}>
            <EQVisualizer analyser={analyser} primaryColor={theme.primary} isPlaying={isPlaying} />
          </div>

          {/* Progress */}
          <div className="player-progress" style={{ width: '100%', maxWidth: 400, marginBottom: '1.1rem' }}>
            <div onClick={seek} style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 100, marginBottom: '0.4rem', cursor: 'pointer' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: theme.primary, borderRadius: 100, transition: 'width 0.3s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--c-muted)' }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="transport-controls" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <button title="Rewind 10 seconds" aria-label="Rewind 10 seconds" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10) }}
              style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '1.3rem', cursor: 'pointer' }}><Icon name="rewind" size={22} /></button>

            <button className="main-play-button" aria-pressed={isPlaying} title={isPlaying ? 'Pause' : 'Play'} aria-label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay} disabled={loading || audioError}
              style={{ width: 58, height: 58, borderRadius: '50%', background: audioError ? '#555' : theme.primary, border: 'none', color: '#0e0b09', fontSize: loading ? '0.65rem' : '1.3rem', cursor: audioError ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: audioError ? 'none' : `0 0 28px ${theme.primary}60`, fontFamily: 'var(--font-mono)' }}>
              {loading ? <span className="loading-spinner" /> : <Icon name={isPlaying ? 'pause' : 'play'} size={24} />}
            </button>

            <button title="Forward 10 seconds" aria-label="Forward 10 seconds" onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10) }}
              style={{ background: 'none', border: 'none', color: 'var(--c-muted)', fontSize: '1.3rem', cursor: 'pointer' }}><Icon name="forward" size={22} /></button>

            {/* Next in queue */}
            {queue.length > 0 && (
              <button title="Next track" aria-label="Next track" onClick={playNext}
                style={{ background: 'none', border: 'none', color: theme.primary, fontSize: '1.1rem', cursor: 'pointer' }}><Icon name="next" size={22} /></button>
            )}
          </div>

          {/* Action buttons */}
          <div className="player-actions" style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
            <button title="Download vibe card" aria-label="Download vibe card" onClick={handleShareCard}
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 10, color: 'var(--c-muted)', padding: '7px 14px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <Icon name="card" size={19} />
            </button>
            <button title="Loop track" aria-label="Loop track" aria-pressed={loop} onClick={() => { setLoop(l => !l); showToast(loop ? 'Loop off' : 'Loop on') }}
              style={{ background: loop ? `${theme.primary}22` : 'var(--c-surface)', border: `1px solid ${loop ? theme.primary : 'var(--c-border)'}`, borderRadius: 10, color: loop ? theme.primary : 'var(--c-muted)', padding: '7px 14px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
              <Icon name="repeat" size={19} />
            </button>
          </div>
        </div>

        {/* Vibe selector */}
        <div id="vibe-options" className="vibe-selector" hidden={!showVibes} role="region" aria-label="Choose vibe" style={{ padding: '0 1.25rem 0.5rem' }}>
          <div className="vibe-grid">
            {vibeList.map((v) => (
              <button aria-label={v.label} title={v.label} aria-pressed={vibe === v.id} key={v.id} onClick={() => handleVibeChange(v.id as VibeId)}
                style={{ flexShrink: 0, background: vibe === v.id ? theme.primary : 'var(--c-surface)', border: `1.5px solid ${vibe === v.id ? theme.primary : 'var(--c-border)'}`, borderRadius: 100, padding: '7px 16px', fontSize: '0.8rem', fontWeight: 600, color: vibe === v.id ? '#0e0b09' : 'var(--c-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: vibe === v.id ? `0 0 18px ${theme.primary}50` : 'none' }}>
                <Icon name={v.icon} size={20} />
              </button>
            ))}
          </div>
        </div>

        {/* Custom panel */}
        {showCustom && (
          <div className="custom-panel" role="region" title="Custom vibe controls" aria-label="Custom vibe controls">
            <div className="custom-panel-heading"><span>Custom vibe</span><button title="Close custom controls" aria-label="Close custom controls" onClick={() => setShowCustom(false)}><Icon name="close" /></button></div>
            {[
              { label: 'Speed',  value: customSpeed,  min: 50,  max: 150,   step: 5,   display: (v: number) => (v/100).toFixed(2)+'x', onChange: handleCustomSpeed },
              { label: 'Reverb', value: customReverb, min: 0,   max: 100,   step: 5,   display: (v: number) => v+'%',                   onChange: handleCustomReverb },
              { label: 'Muffle', value: customLowpass,min: 500, max: 20000, step: 500, display: (v: number) => v>=1000?(v/1000).toFixed(1)+'kHz':v+'Hz', onChange: handleCustomLowpass },
              { label: 'Bass',   value: customBass,   min: -6,  max: 6,     step: 1,   display: (v: number) => (v>=0?'+':'')+v+'dB',    onChange: handleCustomBass },
            ].map((sl) => (
              <div key={sl.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--c-muted)', width: 52, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{sl.label}</label>
                <input aria-label={sl.label} type="range" min={sl.min} max={sl.max} step={sl.step} value={sl.value}
                  onChange={(e) => sl.onChange(Number(e.target.value))}
                  style={{ flex: 1, accentColor: theme.primary }} />
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: theme.primary, width: 52, textAlign: 'right' }}>{sl.display(sl.value)}</span>
              </div>
            ))}

            {/* Preset save */}
            <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem', alignItems: 'center' }}>
              <input title="Preset name" aria-label="Preset name" value={presetName} onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                placeholder="Preset name..."
                style={{ flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--c-border)', borderRadius: 8, color: 'var(--c-text)', fontSize: '0.78rem', fontFamily: 'var(--font-body)', outline: 'none' }} />
              <button title="Save preset" aria-label="Save preset" onClick={handleSavePreset}
                style={{ background: theme.primary, color: '#0e0b09', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                <Icon name="save" />
              </button>
            </div>

            {/* Saved presets */}
            {presets.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: '0.6rem' }}>
                {presets.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8 }}>
                    <span className="preset-label">{p.name}</span>
                    <button aria-label={`Apply ${p.name} preset`} title={`Apply ${p.name} preset`} onClick={() => handleLoadPreset(p)}
                      style={{ background: 'none', border: 'none', color: 'var(--c-text)', padding: '5px 10px', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      <Icon name="play" size={16} />
                    </button>
                    <button title={`Delete ${p.name} preset`} aria-label={`Delete ${p.name} preset`} onClick={() => handleDeletePreset(p.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--c-muted)', padding: '5px 8px 5px 0', fontSize: '0.7rem', cursor: 'pointer' }}><Icon name="close" size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Footer separatorControl={
          <button
            aria-label={showVibes ? 'Hide vibe options' : 'Choose vibe'}
            title={showVibes ? 'Hide vibe options' : 'Choose vibe'}
            aria-expanded={showVibes}
            aria-controls="vibe-options"
            onClick={() => {
              setShowVibes(open => !open)
              if (showVibes) setShowCustom(false)
            }}
          >
            <Icon name={showVibes ? 'down' : 'up'} size={22} />
          </button>
        } />
      </div>

      {/* Queue modal */}
      {showQueue && (
        <>
          {/* Backdrop */}
          <div onClick={() => { setShowQueue(false); setQueueUrl('') }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 49 }} />

          {/* Modal */}
          <div className="slide-up queue-sheet" role="dialog" aria-modal="true" title="Play queue" aria-label="Play queue" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: theme.bg1, border: '1px solid var(--c-border)', borderRadius: '20px 20px 0 0', zIndex: 50, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Queue mein add karo {queue.length > 0 && `· ${queue.length} songs`}
              </span>
              <button title="Close queue" aria-label="Close queue" onClick={() => { setShowQueue(false); setQueueUrl('') }}
                style={{ background: 'none', border: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}><Icon name="close" size={16} /></button>
            </div>

            {/* URL input */}
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  title="YouTube link for queue" aria-label="YouTube link for queue"
                  value={queueUrl}
                  onChange={(e) => setQueueUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrlToQueue()}
                  placeholder="YouTube link yahan paste karo..."
                  autoFocus
                  style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--c-border)', borderRadius: 12, color: 'var(--c-text)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', outline: 'none' }}
                  onFocus={(e) => { e.target.style.borderColor = theme.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.primary}20` }}
                  onBlur={(e) => { e.target.style.borderColor = 'var(--c-border)'; e.target.style.boxShadow = 'none' }}
                />
                <button title="Add track to queue" aria-label="Add track to queue" onClick={handleAddUrlToQueue} disabled={queueAdding}
                  style={{ background: theme.primary, color: '#0e0b09', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700, cursor: queueAdding ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', opacity: queueAdding ? 0.7 : 1 }}>
                  {queueAdding ? <span className="loading-spinner" /> : <Icon name="plus" size={19} />}
                </button>
              </div>
            </div>

            {/* Queue list */}
            <div style={{ overflowY: 'auto', padding: '0.75rem 1.25rem 1.5rem', flex: 1 }}>
              {queue.length === 0 ? (
                <p style={{ color: 'var(--c-muted)', textAlign: 'center', fontSize: '0.8rem', padding: '1.5rem 0', fontFamily: 'var(--font-mono)' }}>
                  Queue khaali hai — upar link paste karo
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {queue.map((q, i) => (
                    <div key={q.id + i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--c-surface)', borderRadius: 10, padding: '9px 12px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--c-muted)', width: 16, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                      {q.thumbnail && <img src={q.thumbnail} alt="" style={{ width: 40, height: 30, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>{q.author}</p>
                      </div>
                      <button title={`Remove ${q.title} from queue`} aria-label={`Remove ${q.title} from queue`} onClick={() => removeFromQueue(i)}
                        style={{ background: 'none', border: 'none', color: 'var(--c-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px', lineHeight: 1 }}><Icon name="close" size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      <div role="status" style={{ visibility: toast.show ? 'visible' : 'hidden', maxWidth: 'calc(100vw - 32px)', position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : 80}px)`, background: theme.primary, color: '#0e0b09', padding: '10px 22px', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, zIndex: 999, transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', whiteSpace: 'normal', fontFamily: 'var(--font-body)', pointerEvents: 'none' }}>
        {toast.msg}
      </div>
    </main>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0e0b09', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        Loading vibe...
      </div>
    }>
      <PlayerContent />
    </Suspense>
  )
}
