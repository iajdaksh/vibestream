import { vibeConfigs } from './utils'

export async function generateVibeCard(
  title: string, author: string, vibe: string, accent: string, background: string,
): Promise<string> {
  await Promise.all([
    document.fonts.load('40px Fraunces'),
    document.fonts.load('24px Manrope'),
    document.fonts.load('600 30px Manrope'),
    document.fonts.load('18px "IBM Plex Mono"'),
  ])
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  // Portrait bank-card proportions (54 : 85.6), at export resolution.
  canvas.height = 1712
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  const text = '#ede3d0'
  const muted = '#9a9086'
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const glow = ctx.createRadialGradient(540, 650, 50, 540, 650, 500)
  glow.addColorStop(0, `${accent}18`)
  glow.addColorStop(1, `${accent}00`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  function label(value: string, x: number, y: number, color: string, font: string, align: CanvasTextAlign = 'left') {
    ctx!.fillStyle = color
    ctx!.font = font
    ctx!.textAlign = align
    ctx!.fillText(value, x, y)
  }
  function rule(y: number) {
    ctx!.beginPath()
    ctx!.moveTo(72, y)
    ctx!.lineTo(1008, y)
    ctx!.strokeStyle = '#ede3d01f'
    ctx!.lineWidth = 1
    ctx!.stroke()
  }
  function truncate(value: string, width: number) {
    if (ctx!.measureText(value).width <= width) return value
    const chars = Array.from(value)
    while (chars.length && ctx!.measureText(chars.join('') + '…').width > width) chars.pop()
    return chars.join('') + '…'
  }

  label('V I B E  S T A T I O N', 72, 106, accent, '20px "IBM Plex Mono", monospace')
  // Match the top navigation: muted "by", radio icon, playradio + muted domain.
  ctx.font = '30px Manrope, sans-serif'
  const domainWidth = ctx.measureText('.buzz').width
  ctx.font = '600 30px Manrope, sans-serif'
  const nameWidth = ctx.measureText('playradio').width
  const nameX = 1008 - domainWidth - nameWidth
  label('by', nameX - 94, 106, muted, '22px Manrope, sans-serif')
  ctx.save()
  ctx.translate(nameX - 54, 79)
  ctx.scale(1.4, 1.4)
  ctx.strokeStyle = text
  ctx.lineWidth = 1.7
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke(new Path2D('M5 8h14a2 2 0 0 1 2 2v10H3V10a2 2 0 0 1 2-2ZM5 8l13-6M16 12h2M16 16h2M12 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0'))
  ctx.restore()
  label('playradio', nameX, 106, text, '600 30px Manrope, sans-serif')
  label('.buzz', nameX + nameWidth, 106, muted, '30px Manrope, sans-serif')
  rule(146)

  // Vinyl uses the same ink surface and active accent as the player.
  ctx.beginPath()
  ctx.arc(540, 650, 286, 0, Math.PI * 2)
  ctx.fillStyle = '#0a0807'
  ctx.fill()
  for (let radius = 108; radius <= 280; radius += 8) {
    ctx.beginPath()
    ctx.arc(540, 650, radius, 0, Math.PI * 2)
    ctx.strokeStyle = '#ede3d00b'
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(540, 650, 96, 0, Math.PI * 2)
  ctx.fillStyle = '#16110d'
  ctx.fill()
  ctx.strokeStyle = `${accent}80`
  ctx.stroke()
  label('PLAYRADIO', 540, 642, accent, '20px "IBM Plex Mono", monospace', 'center')
  label('VIBE STATION', 540, 669, muted, '12px "IBM Plex Mono", monospace', 'center')

  const mode = vibe === 'custom' ? 'CUSTOM VIBE' : vibeConfigs[vibe]?.statusLabel || 'NORMAL MODE'
  label(mode, 540, 1020, accent, '22px "IBM Plex Mono", monospace', 'center')

  ctx.font = '40px Fraunces, Georgia, serif'
  const words = title.trim().split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i]
    if (ctx.measureText(next).width > 880 && line) {
      lines.push(line)
      line = words.slice(i).join(' ')
      break
    }
    line = next
  }
  if (line) lines.push(line)
  lines.slice(0, 2).forEach((value, i) => {
    label(truncate(value, 880), 540, 1100 + i * 54, text, '40px Fraunces, Georgia, serif', 'center')
  })
  ctx.font = '24px Manrope, sans-serif'
  label(truncate(author, 840), 540, 1214, muted, '24px Manrope, sans-serif', 'center')

  // Decorative audio bars, freshly randomized for each export (not a scannable code).
  const barCount = 37
  const barWidth = 10
  const barGap = 9
  const waveformWidth = barCount * barWidth + (barCount - 1) * barGap
  const waveformLeft = (canvas.width - waveformWidth) / 2
  const randomValues = crypto.getRandomValues(new Uint8Array(barCount))
  ctx.fillStyle = accent
  for (let i = 0; i < barCount; i++) {
    const height = 20 + Math.round((randomValues[i] / 255) * 88)
    ctx.beginPath()
    ctx.roundRect(waveformLeft + i * (barWidth + barGap), 1484 - height / 2, barWidth, height, barWidth / 2)
    ctx.fill()
  }

  rule(1584)
  const footerColor = 'rgba(154, 144, 134, .6)'
  const footerFont = '22px "IBM Plex Mono", monospace'
  label(`© ${new Date().getFullYear()} PlayRadio.buzz`, 72, 1634, footerColor, footerFont)
  label('Made with ♥ by AJ Daskh', 1008, 1634, footerColor, footerFont, 'right')
  return canvas.toDataURL('image/png')
}
