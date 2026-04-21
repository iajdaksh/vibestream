// ── Types ─────────────────────────────────────────────────────────────────

export interface HistoryItem {
  id: string
  title: string
  author: string
  thumbnail: string
  vibe: string
  playedAt: number
}

export interface VibePreset {
  id: string
  name: string
  speed: number
  reverb: number
  lowpass: number
  bass: number
}

export interface QueueItem {
  id: string
  title: string
  author: string
  thumbnail: string
}

// ── Keys ──────────────────────────────────────────────────────────────────

const KEYS = {
  history: 'vs_history',
  presets: 'vs_presets',
  queue:   'vs_queue',
  bass:    'vs_global_bass',
}

// ── History ───────────────────────────────────────────────────────────────

export function getHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.history) || '[]')
  } catch { return [] }
}

export function addToHistory(item: Omit<HistoryItem, 'playedAt'>) {
  const history = getHistory().filter((h) => h.id !== item.id)
  history.unshift({ ...item, playedAt: Date.now() })
  localStorage.setItem(KEYS.history, JSON.stringify(history.slice(0, 20)))
}

export function clearHistory() {
  localStorage.removeItem(KEYS.history)
}

// ── Presets ───────────────────────────────────────────────────────────────

export function getPresets(): VibePreset[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.presets) || '[]')
  } catch { return [] }
}

export function savePreset(preset: Omit<VibePreset, 'id'>): VibePreset {
  const presets = getPresets()
  const newPreset: VibePreset = { ...preset, id: Date.now().toString() }
  presets.unshift(newPreset)
  localStorage.setItem(KEYS.presets, JSON.stringify(presets.slice(0, 10)))
  return newPreset
}

export function deletePreset(id: string) {
  const presets = getPresets().filter((p) => p.id !== id)
  localStorage.setItem(KEYS.presets, JSON.stringify(presets))
}

// ── Queue ─────────────────────────────────────────────────────────────────

export function getQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.queue) || '[]')
  } catch { return [] }
}

export function saveQueue(queue: QueueItem[]) {
  localStorage.setItem(KEYS.queue, JSON.stringify(queue))
}

export function clearQueue() {
  localStorage.removeItem(KEYS.queue)
}

// ── Global bass ───────────────────────────────────────────────────────────

export function getGlobalBass(): number {
  return Number(localStorage.getItem(KEYS.bass) || '0')
}

export function setGlobalBass(val: number) {
  localStorage.setItem(KEYS.bass, String(val))
}
