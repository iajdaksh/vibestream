'use client'

interface VinylProps {
  isPlaying: boolean
  playbackRate: number
  vibeLabel: string
  primaryColor: string
}

export default function Vinyl({ isPlaying, playbackRate, vibeLabel, primaryColor }: VinylProps) {
  const baseDuration = 2.4
  const duration = baseDuration / playbackRate

  return (
    <div className="relative" style={{ width: 240, height: 240 }}>
      <svg
        viewBox="0 0 240 240"
        xmlns="http://www.w3.org/2000/svg"
        className="vinyl-spinning"
        style={{
          width: '100%',
          height: '100%',
          animationDuration: `${duration}s`,
          animationPlayState: isPlaying ? 'running' : 'paused',
        }}
      >
        <defs>
          <radialGradient id="vg-disc" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2d1b36" />
            <stop offset="40%" stopColor="#1a0b2e" />
            <stop offset="100%" stopColor="#0c0a1d" />
          </radialGradient>
          <radialGradient id="vg-label" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3d2a5a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Outer disc */}
        <circle cx="120" cy="120" r="118" fill="url(#vg-disc)" stroke="#2d1b36" strokeWidth="1" />

        {/* Grooves */}
        {[108, 99, 90, 81, 72, 63, 54].map((r) => (
          <circle
            key={r}
            cx="120"
            cy="120"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1.5"
          />
        ))}

        {/* Label area */}
        <circle cx="120" cy="120" r="46" fill="url(#vg-label)" />
        <circle
          cx="120"
          cy="120"
          r="45"
          fill="#1e0f30"
          stroke={`${primaryColor}40`}
          strokeWidth="1.5"
        />

        {/* Label text */}
        <text
          x="120"
          y="115"
          textAnchor="middle"
          fill={primaryColor}
          fontSize="9"
          fontFamily="Space Mono, monospace"
          fontWeight="700"
          letterSpacing="2"
        >
          VIBESTREAM
        </text>
        <text
          x="120"
          y="128"
          textAnchor="middle"
          fill={`${primaryColor}80`}
          fontSize="7"
          fontFamily="Space Mono, monospace"
          letterSpacing="1"
        >
          {vibeLabel.toUpperCase()}
        </text>

        {/* Center hole */}
        <circle cx="120" cy="120" r="5.5" fill="#0c0a1d" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

        {/* Shine highlight */}
        <ellipse
          cx="88"
          cy="82"
          rx="20"
          ry="9"
          fill="rgba(255,255,255,0.05)"
          transform="rotate(-30, 88, 82)"
        />
      </svg>
    </div>
  )
}
