'use client'

import { useEffect, useRef } from 'react'

export type VibeId =
  | 'normal' | 'lofi' | 'slowed' | 'nightcore' | '3am'
  | '8d' | 'phonk' | 'study' | 'bedroom' | 'drill' | 'custom'

interface Orb {
  x: number       // left %
  y: number       // top %
  size: number    // px
  color: string
  blur: number
  opacity: number
  anim: string
  dur: string
  delay: string
}

interface VibeConfig {
  orbs: Orb[]
  noise?: boolean      // grain overlay
  scanlines?: boolean  // horizontal line overlay
  particles?: boolean  // extra tiny dots
}

const configs: Record<VibeId, VibeConfig> = {
  normal: {
    orbs: [
      { x: 15, y: 20, size: 320, color: '#A78BFA', blur: 120, opacity: 0.18, anim: 'amb-float', dur: '9s', delay: '0s' },
      { x: 65, y: 55, size: 260, color: '#7C3AED', blur: 100, opacity: 0.14, anim: 'amb-drift', dur: '13s', delay: '-4s' },
      { x: 40, y: 80, size: 200, color: '#C4B5FD', blur: 90,  opacity: 0.10, anim: 'amb-float', dur: '11s', delay: '-6s' },
    ],
  },
  lofi: {
    orbs: [
      { x: 10, y: 10, size: 400, color: '#D97706', blur: 160, opacity: 0.15, anim: 'amb-drift',  dur: '18s', delay: '0s' },
      { x: 60, y: 50, size: 350, color: '#92400E', blur: 140, opacity: 0.12, anim: 'amb-float',  dur: '22s', delay: '-8s' },
      { x: 35, y: 75, size: 280, color: '#F59E0B', blur: 120, opacity: 0.08, anim: 'amb-drift',  dur: '16s', delay: '-3s' },
    ],
    noise: true,
  },
  slowed: {
    orbs: [
      { x: 5,  y: 5,  size: 500, color: '#1E3A8A', blur: 200, opacity: 0.22, anim: 'amb-slow',   dur: '30s', delay: '0s'  },
      { x: 55, y: 45, size: 420, color: '#4338CA', blur: 180, opacity: 0.18, anim: 'amb-float',  dur: '28s', delay: '-12s' },
      { x: 25, y: 70, size: 360, color: '#312E81', blur: 160, opacity: 0.14, anim: 'amb-slow',   dur: '35s', delay: '-5s' },
    ],
  },
  nightcore: {
    orbs: [
      { x: 20, y: 10, size: 250, color: '#EC4899', blur: 90,  opacity: 0.25, anim: 'amb-pulse',  dur: '3s',  delay: '0s'  },
      { x: 60, y: 35, size: 200, color: '#06B6D4', blur: 80,  opacity: 0.22, anim: 'amb-pulse',  dur: '2.5s',delay: '-1s' },
      { x: 40, y: 65, size: 180, color: '#A855F7', blur: 70,  opacity: 0.20, anim: 'amb-pulse',  dur: '3.5s',delay: '-2s' },
      { x: 80, y: 20, size: 140, color: '#F472B6', blur: 60,  opacity: 0.18, anim: 'amb-pulse',  dur: '2s',  delay: '-0.5s' },
    ],
    particles: true,
  },
  '3am': {
    orbs: [
      { x: 0,  y: 30, size: 450, color: '#064E3B', blur: 180, opacity: 0.16, anim: 'amb-mist',   dur: '40s', delay: '0s'  },
      { x: 50, y: 60, size: 380, color: '#065F46', blur: 160, opacity: 0.12, anim: 'amb-mist',   dur: '50s', delay: '-15s' },
      { x: 20, y: 10, size: 300, color: '#0F172A', blur: 140, opacity: 0.25, anim: 'amb-float',  dur: '25s', delay: '-8s' },
    ],
    noise: true,
  },
  '8d': {
    orbs: [
      { x: 10, y: 30, size: 360, color: '#7C3AED', blur: 150, opacity: 0.20, anim: 'amb-swing-r', dur: '8s',  delay: '0s'  },
      { x: 60, y: 40, size: 300, color: '#06B6D4', blur: 130, opacity: 0.17, anim: 'amb-swing-l', dur: '8s',  delay: '-4s' },
      { x: 35, y: 70, size: 240, color: '#A78BFA', blur: 110, opacity: 0.13, anim: 'amb-swing-r', dur: '8s',  delay: '-2s' },
    ],
  },
  phonk: {
    orbs: [
      { x: 10, y: 20, size: 350, color: '#7F1D1D', blur: 140, opacity: 0.28, anim: 'amb-flicker', dur: '4s',  delay: '0s'  },
      { x: 60, y: 55, size: 280, color: '#DC2626', blur: 110, opacity: 0.20, anim: 'amb-pulse',   dur: '2s',  delay: '-1s' },
      { x: 35, y: 80, size: 220, color: '#450A0A', blur: 100, opacity: 0.30, anim: 'amb-flicker', dur: '3s',  delay: '-2s' },
    ],
    scanlines: true,
  },
  study: {
    orbs: [
      { x: 20, y: 25, size: 280, color: '#059669', blur: 110, opacity: 0.12, anim: 'amb-float', dur: '14s', delay: '0s'  },
      { x: 65, y: 60, size: 220, color: '#0D9488', blur: 90,  opacity: 0.10, anim: 'amb-drift', dur: '18s', delay: '-6s' },
      { x: 45, y: 85, size: 180, color: '#34D399', blur: 80,  opacity: 0.08, anim: 'amb-float', dur: '20s', delay: '-10s' },
    ],
  },
  bedroom: {
    orbs: [
      { x: 15, y: 15, size: 380, color: '#DB2777', blur: 150, opacity: 0.16, anim: 'amb-drift', dur: '16s', delay: '0s'  },
      { x: 60, y: 50, size: 320, color: '#F472B6', blur: 130, opacity: 0.13, anim: 'amb-float', dur: '20s', delay: '-7s' },
      { x: 35, y: 78, size: 260, color: '#FB923C', blur: 110, opacity: 0.10, anim: 'amb-drift', dur: '18s', delay: '-4s' },
    ],
  },
  drill: {
    orbs: [
      { x: 10, y: 10, size: 300, color: '#1F2937', blur: 120, opacity: 0.40, anim: 'amb-pulse',   dur: '1.5s', delay: '0s'   },
      { x: 65, y: 45, size: 250, color: '#374151', blur: 100, opacity: 0.30, anim: 'amb-flicker',  dur: '2s',   delay: '-0.5s' },
      { x: 40, y: 75, size: 200, color: '#6B7280', blur: 80,  opacity: 0.20, anim: 'amb-pulse',   dur: '1s',   delay: '-1s'  },
    ],
    scanlines: true,
  },
  custom: {
    orbs: [
      { x: 20, y: 20, size: 320, color: '#A78BFA', blur: 130, opacity: 0.15, anim: 'amb-float', dur: '12s', delay: '0s'  },
      { x: 60, y: 60, size: 260, color: '#7C3AED', blur: 110, opacity: 0.12, anim: 'amb-drift', dur: '16s', delay: '-5s' },
    ],
  },
}

interface Props {
  vibe: VibeId
  isPlaying: boolean
}

export default function VibeBackground({ vibe, isPlaying }: Props) {
  const cfg = configs[vibe] ?? configs.normal
  const pausedStyle = !isPlaying ? { animationPlayState: 'paused' } as React.CSSProperties : {}

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Orbs */}
      {cfg.orbs.map((orb, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `calc(${orb.x}% - ${orb.size / 2}px)`,
          top:  `calc(${orb.y}% - ${orb.size / 2}px)`,
          width:  orb.size,
          height: orb.size,
          borderRadius: '50%',
          background: orb.color,
          filter: `blur(${orb.blur}px)`,
          opacity: orb.opacity,
          animation: `${orb.anim} ${orb.dur} ease-in-out infinite`,
          animationDelay: orb.delay,
          willChange: 'transform, opacity',
          ...pausedStyle,
        }} />
      ))}

      {/* Grain overlay for lofi / 3am */}
      {cfg.noise && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.07\'/%3E%3C/svg%3E")',
          backgroundSize: '256px 256px',
          opacity: 0.35,
          mixBlendMode: 'overlay',
        }} />
      )}

      {/* Scanlines for phonk / drill */}
      {cfg.scanlines && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Sparkle particles for nightcore */}
      {cfg.particles && (
        <NightcoreParticles isPlaying={isPlaying} />
      )}
    </div>
  )
}

// Tiny star particles for nightcore
function NightcoreParticles({ isPlaying }: { isPlaying: boolean }) {
  const stars = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      dur: (Math.random() * 1.5 + 0.8).toFixed(2) + 's',
      delay: (-(Math.random() * 3)).toFixed(2) + 's',
      color: ['#F472B6', '#06B6D4', '#A855F7', '#FBBF24', '#fff'][Math.floor(Math.random() * 5)],
    }))
  )

  return (
    <>
      {stars.current.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${s.x}%`,
          top:  `${s.y}%`,
          width:  s.size,
          height: s.size,
          borderRadius: '50%',
          background: s.color,
          opacity: 0,
          animation: `amb-sparkle ${s.dur} ease-in-out infinite`,
          animationDelay: s.delay,
          animationPlayState: isPlaying ? 'running' : 'paused',
          boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
        }} />
      ))}
    </>
  )
}
