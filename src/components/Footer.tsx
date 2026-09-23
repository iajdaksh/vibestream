import Icon from './Icon'
import type { ReactNode } from 'react'

export default function Footer({ separatorControl }: { separatorControl?: ReactNode }) {
  return (
    <footer className={`site-footer${separatorControl ? ' has-separator-control' : ''}`}>
      {separatorControl && <div className="footer-separator-control">{separatorControl}</div>}
      <span>© {new Date().getFullYear()} PlayRadio.buzz</span>
      <a href="https://hashlink.online/iajdaksh" target="_blank" rel="noreferrer">
        Made with <Icon name="heart" size={11} fill="currentColor" /><span className="sr-only">love</span> by AJ Daskh
      </a>
    </footer>
  )
}
