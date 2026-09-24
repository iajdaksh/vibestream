import type { SVGProps } from 'react'

const paths = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10ZM9 21v-7h6v7',
  support: 'M11.5 11.5 6.3 8.8a2.5 2.5 0 0 0-3.1.7 2.5 2.5 0 0 0 .5 3.7l6.7 5.1a4 4 0 0 0 4.9-.1l5.3-4.3a2.5 2.5 0 0 0 .3-3.5 2.5 2.5 0 0 0-3.5-.3l-3.1 2.5M12 8.5c-1.9-1.8-4-3.8-4-5.1A2.1 2.1 0 0 1 12 2.5a2.1 2.1 0 0 1 4 0c0 1.3-2.1 3.3-4 5.1Z',
  up: 'm6 15 6-6 6 6',
  down: 'm6 9 6 6 6-6',
  save: 'M4 3h13l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  play: 'm9 5 11 7-11 7Z',
  pause: 'M8 5v14M16 5v14',
  back: 'm12 5-7 7 7 7M5 12h15',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  volume: 'm11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14',
  queue: 'M4 6h16M4 12h10M4 18h10M19 14v8M15 18h8',
  rewind: 'm11 5-9 7 9 7Zm10 0-9 7 9 7Z',
  forward: 'm3 5 9 7-9 7Zm10 0 9 7-9 7Z',
  next: 'm5 5 10 7-10 7ZM19 5v14',
  repeat: 'm17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  card: 'M3 3h18v18H3ZM7 8h10M7 12h6M7 16h8',
  close: 'm6 6 12 12M6 18 18 6',
  plus: 'M12 5v14M5 12h14',
  alert: 'm12 3 10 18H2ZM12 9v4M12 17h.01',
  normal: 'M9 18V5l12-3v13M9 9l12-3M9 18a3 3 0 1 1-3-3h3M21 15a3 3 0 1 1-3-3h3',
  lofi: 'M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM17 9h2a3 3 0 0 1 0 6h-2M7 2v3M12 2v3',
  slowed: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
  nightcore: 'm13 2-9 12h7l-1 8 10-13h-7Z',
  '3am': 'M5 14a5 5 0 1 1 2-9 6 6 0 0 1 11 2 4 4 0 0 1 1 8M7 17l-1 4M12 16l-1 4M17 17l-1 4',
  '8d': 'M3 14v-2a9 9 0 0 1 18 0v2M3 13h4v8H3ZM17 13h4v8h-4Z',
  phonk: 'M12 2c1 5-5 6-5 10-2-1-2-3-2-3-4 9 3 13 7 13s11-4 7-12c0 4-3 5-3 5 1-6-4-13-4-13Z',
  study: 'M12 5v16M12 5C9 2 5 3 2 4v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-2-10 1Z',
  bedroom: 'M3 18V7M3 14h18v7M3 18h18M7 14V9h5v5M12 11h6a3 3 0 0 1 3 3',
  drill: 'M3 8c0-4 18-4 18 0s-18 4-18 0ZM3 8v9c0 4 18 4 18 0V8M7 11v7M17 11v7M6 2l8 3M18 2l-5 3',
  custom: 'M5 3v7M5 14v7M12 3v11M12 18v3M19 3v2M19 9v12M2 10h6M9 14h6M16 5h6',
  radio: 'M5 8h14a2 2 0 0 1 2 2v10H3V10a2 2 0 0 1 2-2ZM5 8l13-6M16 12h2M16 16h2M12 14a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  check: 'm5 12 4 4L19 6',
} as const

export type IconName = keyof typeof paths

export default function Icon({ name, size = 18, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="icon" {...props}><path d={paths[name]} /></svg>
}
