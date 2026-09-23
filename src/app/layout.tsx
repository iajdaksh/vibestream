import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://vibe.playradio.buzz'),
  title: 'Vibe by PlayRadio — Find your frequency',
  description: 'Apply live audio vibes to any YouTube song. Lofi, Slowed+Reverb, Nightcore and more.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0e0b09',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
