import type { ReactNode } from 'react'

export default function Footer({ separatorControl, leftControls, rightControls, popup }: { separatorControl?: ReactNode; leftControls?: ReactNode; rightControls?: ReactNode; popup?: ReactNode }) {
  return (
    <footer className={`site-footer${separatorControl ? ' has-separator-control' : ''}`}>
      {popup}
      {separatorControl && <div className="footer-separator-control">{separatorControl}</div>}
      {leftControls && <div className="footer-left-controls">{leftControls}</div>}
      {rightControls && <div className="footer-right-controls">{rightControls}</div>}
      <span>© {new Date().getFullYear()} PlayRadio.buzz</span>
      <a href="https://hashlink.online/iajdaksh" target="_blank" rel="noreferrer">
        Made with <span aria-label="love">♥</span> by AJ Daskh
      </a>
    </footer>
  )
}
