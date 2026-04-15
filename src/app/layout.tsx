import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Vibestream — Drop a link. Pick a vibe. Disappear.',
  description: 'Apply live audio vibes to any YouTube song. Lofi, Slowed+Reverb, Nightcore and more.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0C0A1D',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
