import Icon from './Icon'

export default function Brand() {
  return <nav className="brand-bar" aria-label="PlayRadio">
    <a href="/" className="brand-channel station-home">Vibe Station</a>
    <a href="https://playradio.buzz" className="brand-link"><span className="brand-by">by</span><Icon name="radio" size={17} /><span>playradio<span className="brand-domain">.buzz</span></span></a>
  </nav>
}
