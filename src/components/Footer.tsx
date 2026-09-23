import Icon from './Icon'

export default function Footer() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} PlayRadio.buzz</span>
      <a href="https://hashlink.online/iajdaksh" target="_blank" rel="noreferrer">
        Made with <Icon name="heart" size={11} fill="currentColor" /><span className="sr-only">love</span> by AJ Daskh
      </a>
    </footer>
  )
}
