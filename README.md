# Vibestream

> Drop a link. Pick a vibe. Disappear.

Stream any YouTube song with real-time audio effects — Lofi, Slowed+Reverb, Nightcore, 3AM Storm, and 8D — processed live in the browser via Web Audio API.

---

## How It Works

YouTube IFrame audio cannot be processed due to CORS restrictions. Vibestream works around this by:

1. `yt-dlp.exe` (bundled binary) fetches the real audio stream URL from YouTube, bypassing the n-parameter obfuscation that breaks `ytdl-core`
2. `/api/audio?v=ID` proxies the stream server-side (same-origin), so the browser `<audio>` element can load it
3. `AudioContext.createMediaElementSource()` connects the audio element into the Web Audio API chain
4. Real DSP effects (EQ, convolution reverb, stereo panning) are applied live on the actual audio

> First load takes ~5-8 seconds while yt-dlp fetches stream info. No caching yet.

---

## Requirements

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** (bundled with Node.js)
- **Windows** — `yt-dlp.exe` is the bundled binary (replace with `yt-dlp` on Linux/Mac and update the path in the API route)

---

## Setup

```bash
# 1. Enter the project folder
cd vibestream

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Features

| Vibe | Effect |
|------|--------|
| **Normal** | Original audio, no processing |
| **Lofi** | Lowpass 3.2 kHz + bass +4 dB |
| **Slowed + Reverb** | 0.75x playback + convolution reverb |
| **Nightcore** | 1.25x playback + treble +5 dB |
| **3AM Storm** | Dark lowpass + reverb |
| **8D** | Rotating StereoPannerNode |
| **Custom** | Manual speed + EQ sliders |

Additional:
- **EQ Visualizer** — real-time frequency bars
- **Vibe Background** — animated background per vibe
- **Vinyl animation** — spinning record synced to playback
- **Waveform display** — live audio waveform
- **YouTube search** — search directly from the app
- **Time Theme** — UI color shifts with time of day
- **Share** — copy a shareable link

---

## Project Structure

```
vibestream/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Home / search page
│   │   ├── play/page.tsx         ← Player page
│   │   ├── layout.tsx            ← Root layout
│   │   └── api/
│   │       ├── audio/            ← Proxies YouTube audio stream
│   │       ├── meta/             ← Fetches title/author/duration via yt-dlp
│   │       └── search/           ← YouTube search
│   ├── components/
│   │   ├── Vinyl.tsx             ← Spinning vinyl record
│   │   ├── Waveform.tsx          ← Audio waveform bars
│   │   ├── EQVisualizer.tsx      ← Real-time EQ frequency display
│   │   └── VibeBackground.tsx    ← Animated vibe-specific background
│   └── lib/
│       ├── utils.ts              ← Vibe configs + theme helpers
│       ├── vibeAudio.ts          ← Web Audio API engine (VibeAudioEngine)
│       └── storage.ts            ← Client-side persistence
├── yt-dlp.exe                    ← yt-dlp binary (YouTube stream extraction)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Audio Effects | Web Audio API (native browser) |
| Audio Synthesis | Tone.js v14 |
| Stream Extraction | yt-dlp binary + yt-dlp-wrap-extended |
| Proxy | Next.js API Routes (same-origin audio stream) |

---

## API Routes

| Route | Description |
|-------|-------------|
| `GET /api/audio?v=VIDEO_ID` | Proxies the YouTube audio stream |
| `GET /api/meta?v=VIDEO_ID` | Returns title, author, and duration |
| `GET /api/search?q=QUERY` | Returns YouTube search results |

---

## Deployment

> `yt-dlp.exe` must be present on the server. On Linux/Mac, replace it with the appropriate `yt-dlp` binary and update the path in the API route.

```bash
npm run build
npm start
```

For Vercel or similar platforms, the yt-dlp approach requires the Node.js runtime (not Edge). Make sure the binary is included in the deployment and the API routes specify `export const runtime = 'nodejs'`.

---

## Legal

This app proxies YouTube audio for personal use. It does not store or redistribute content.

> "This product uses YouTube API Services. Not affiliated with YouTube/Google."

---

Made with care by Aj Daksh (x.com/iajdaksh)