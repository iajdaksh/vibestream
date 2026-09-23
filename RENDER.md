# Render playback setup

The reported `Sign in to confirm you're not a bot` error is a YouTube challenge against the server request. Finding the executable does not mean extraction succeeded. Updating the binary and enabling JavaScript resolves setup problems, but does not guarantee that YouTube will accept the server session.

## Deploy

- Node.js: 22 or newer (`.node-version` sets 22; remove any conflicting Render `NODE_VERSION` override).
- Build: `npm ci && npm run build`.
- Start: `npm start`.
- Each production build refreshes the standalone yt-dlp executable, including its bundled EJS scripts. A failed refresh fails the build instead of silently deploying an old executable.
- Audio and search enable Node explicitly with `--js-runtimes node:<node executable>`. Metadata uses YouTube oEmbed independently.

## Optional authenticated session

If YouTube still requires sign-in, follow the [official cookie export instructions](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies). Cookies are account credentials; do not paste them into chat, commit them, or expose them to browsers. The upstream documentation warns that using an account this way can lead to account restrictions.

1. In Render → Environment → Secret Files, add a Netscape-format `youtube-cookies.txt` file containing the exported YouTube cookies.
2. Set `YTDLP_COOKIES_FILE=/etc/secrets/youtube-cookies.txt`.
3. Redeploy. The app copies the mounted file into a private, temporary per-request cookie jar and deletes that copy afterward. It never modifies the mounted secret.

See [Render secret-file documentation](https://render.com/docs/configure-environment-variables#secret-files).

Cookies may expire or still be rejected; they are not a guaranteed fix for a hosting-IP restriction. Do not repeatedly retry or assume switching extractor libraries resolves the challenge.

## Verify

Play a public video and inspect the `/api/audio?v=VIDEO_ID` network request. Success returns audio with HTTP 200 or 206. Failure returns JSON with a stable error code, such as `YOUTUBE_AUTH_REQUIRED`, `YOUTUBE_FORMAT_UNAVAILABLE`, or `YOUTUBE_STREAM_REJECTED`. Check `[YouTube extraction]` in Render logs for the underlying warning/error. Metadata success alone does not prove audio playback works.

Run `node scripts/test-youtube.cjs` and `npx tsc --noEmit` locally. Route tests mock YouTube; real Render playback still needs deployment verification.
