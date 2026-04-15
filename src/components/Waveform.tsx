'use client'

import { useMemo } from 'react'

interface WaveformProps {
  primaryColor: string
  playbackRate: number
  isPlaying: boolean
}

export default function Waveform({ primaryColor, playbackRate, isPlaying }: WaveformProps) {
  const bars = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      height: 8 + Math.random() * 24,
      duration: (0.5 + Math.random() * 1.2) / playbackRate,
      delay: Math.random() * 0.8,
    }))
  }, [playbackRate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36 }}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            width: 3,
            height: bar.height,
            background: primaryColor,
            borderRadius: 100,
            opacity: isPlaying ? 0.7 : 0.2,
            animationDuration: `${bar.duration}s`,
            animationDelay: `${bar.delay}s`,
            transition: 'opacity 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}
