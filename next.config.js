/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
  outputFileTracingIncludes: {
    '/api/audio': ['./yt-dlp', './yt-dlp.exe'],
    '/api/meta': ['./yt-dlp', './yt-dlp.exe'],
    '/api/search': ['./yt-dlp', './yt-dlp.exe'],
  },
}

module.exports = nextConfig
