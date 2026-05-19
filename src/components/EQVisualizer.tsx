'use client'

import { useEffect, useRef } from 'react'

interface EQVisualizerProps {
  analyser: AnalyserNode | null
  primaryColor: string
  isPlaying: boolean
}

export default function EQVisualizer({ analyser, primaryColor, isPlaying }: EQVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastFrameRef = useRef<Uint8Array | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const BAR_COUNT = 48
    const GAP = 2

    // Parse primaryColor to rgba for glow
    const hex = primaryColor.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)

      if (!analyser || !isPlaying) {
        // Idle animation: slow falling bars
        if (!lastFrameRef.current) {
          lastFrameRef.current = new Uint8Array(BAR_COUNT).fill(20)
        }
        const idle = lastFrameRef.current
        for (let i = 0; i < idle.length; i++) {
          idle[i] = Math.max(8, idle[i] - 1)
        }
        renderBars(ctx!, W, H, BAR_COUNT, GAP, idle, r, g, b, 0.25)
        return
      }

      const bufLen = analyser.frequencyBinCount
      const data = new Uint8Array(bufLen)
      analyser.getByteFrequencyData(data)

      // Downsample to BAR_COUNT bars, weight toward lower freqs
      const bars = new Uint8Array(BAR_COUNT)
      for (let i = 0; i < BAR_COUNT; i++) {
        const lo = Math.floor((i / BAR_COUNT) * bufLen * 0.75)
        const hi = Math.floor(((i + 1) / BAR_COUNT) * bufLen * 0.75)
        let sum = 0
        for (let j = lo; j <= hi; j++) sum += data[j]
        bars[i] = sum / Math.max(1, hi - lo + 1)
      }

      lastFrameRef.current = bars
      renderBars(ctx, W, H, BAR_COUNT, GAP, bars, r, g, b, 1)
    }

    draw()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [analyser, isPlaying, primaryColor])

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={56}
      style={{ display: 'block', borderRadius: 8 }}
    />
  )
}

function renderBars(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  barCount: number, gap: number,
  bars: Uint8Array,
  r: number, g: number, b: number,
  alpha: number,
) {
  ctx.clearRect(0, 0, W, H)

  const barW = (W - gap * (barCount - 1)) / barCount

  for (let i = 0; i < barCount; i++) {
    const val = bars[i] / 255
    const barH = Math.max(3, val * H)
    const x = i * (barW + gap)
    const y = H - barH

    // Gradient: brighter at top
    const grad = ctx.createLinearGradient(0, y, 0, H)
    grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
    grad.addColorStop(1, `rgba(${r},${g},${b},${alpha * 0.3})`)

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, y, barW, barH, 2)
    ctx.fill()
  }
}
