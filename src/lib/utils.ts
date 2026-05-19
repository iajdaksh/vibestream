export interface Theme {
  id: string
  name: string
  primary: string
  bg1: string
  bg2: string
  vibeHint: string
  gradient: string
}

export const themes: Record<string, Theme> = {
  dawn: {
    id: 'dawn',
    name: 'Sunrise',
    primary: '#FF9A76',
    bg1: '#2D1B36',
    bg2: '#1A0B2E',
    vibeHint: 'Normal mood',
    gradient:
      'radial-gradient(ellipse at 20% 50%, rgba(255,154,118,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,179,128,0.4) 0%, transparent 50%)',
  },
  morning: {
    id: 'morning',
    name: 'Coffee Hour',
    primary: '#FFC93C',
    bg1: '#1E293B',
    bg2: '#0F172A',
    vibeHint: 'Lofi mood',
    gradient:
      'radial-gradient(ellipse at 30% 40%, rgba(255,201,60,0.35) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(255,184,56,0.35) 0%, transparent 50%)',
  },
  afternoon: {
    id: 'afternoon',
    name: 'Focus Mode',
    primary: '#38BDF8',
    bg1: '#1E293B',
    bg2: '#0F172A',
    vibeHint: 'Normal mood',
    gradient:
      'radial-gradient(ellipse at 60% 30%, rgba(56,189,248,0.3) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(14,165,233,0.35) 0%, transparent 50%)',
  },
  evening: {
    id: 'evening',
    name: 'Golden Hour',
    primary: '#FB923C',
    bg1: '#2D1B36',
    bg2: '#1A0B2E',
    vibeHint: 'Lofi mood',
    gradient:
      'radial-gradient(ellipse at 80% 20%, rgba(251,146,60,0.4) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(249,115,22,0.4) 0%, transparent 50%)',
  },
  night: {
    id: 'night',
    name: '3AM Thoughts',
    primary: '#A78BFA',
    bg1: '#0C0A1D',
    bg2: '#000000',
    vibeHint: 'Slowed + Reverb mood',
    gradient:
      'radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(124,58,237,0.3) 0%, transparent 50%)',
  },
}

export function getCurrentTheme(): Theme {
  const h = new Date().getHours()
  if (h >= 5 && h < 9) return themes.dawn
  if (h >= 9 && h < 12) return themes.morning
  if (h >= 12 && h < 17) return themes.afternoon
  if (h >= 17 && h < 21) return themes.evening
  return themes.night
}

export function parseYouTubeId(url: string): string | null {
  if (!url) return null
  url = url.trim()
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url
  return null
}

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds || 0)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}

export interface VibeConfig {
  id: string
  label: string
  statusLabel: string
  rate: number
  statusColor: string
  emoji: string
}

export const vibeConfigs: Record<string, VibeConfig> = {
  normal: {
    id: 'normal',
    label: 'Normal',
    statusLabel: 'NORMAL MODE',
    rate: 1.0,
    statusColor: '#A78BFA',
    emoji: '🎵',
  },
  lofi: {
    id: 'lofi',
    label: 'Lofi',
    statusLabel: 'LOFI VIBES',
    rate: 0.85,
    statusColor: '#FFC93C',
    emoji: '☕',
  },
  slowed: {
    id: 'slowed',
    label: 'Slowed + Reverb',
    statusLabel: 'SLOWED + REVERB',
    rate: 0.75,
    statusColor: '#60A5FA',
    emoji: '🌙',
  },
  nightcore: {
    id: 'nightcore',
    label: 'Nightcore',
    statusLabel: 'NIGHTCORE ENERGY',
    rate: 1.25,
    statusColor: '#F472B6',
    emoji: '⚡',
  },
  '3am': {
    id: '3am',
    label: '3AM Storm',
    statusLabel: '3AM STORM MODE',
    rate: 0.8,
    statusColor: '#6EE7B7',
    emoji: '🌧️',
  },
  '8d': {
    id: '8d',
    label: '8D Audio 🎧',
    statusLabel: '8D SPATIAL MODE',
    rate: 1.0,
    statusColor: '#34D399',
    emoji: '🎧',
  },
  phonk: {
    id: 'phonk',
    label: 'Phonk 🔥',
    statusLabel: 'PHONK MODE',
    rate: 0.92,
    statusColor: '#F87171',
    emoji: '🔥',
  },
  study: {
    id: 'study',
    label: 'Study 📖',
    statusLabel: 'STUDY MODE',
    rate: 1.0,
    statusColor: '#67E8F9',
    emoji: '📖',
  },
  bedroom: {
    id: 'bedroom',
    label: 'Bedroom Pop 🌙',
    statusLabel: 'BEDROOM POP',
    rate: 0.95,
    statusColor: '#F9A8D4',
    emoji: '🌙',
  },
  drill: {
    id: 'drill',
    label: 'Drill 🥁',
    statusLabel: 'DRILL MODE',
    rate: 1.0,
    statusColor: '#A3E635',
    emoji: '🥁',
  },
}
