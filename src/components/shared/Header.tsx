import { AboutPanel } from './AboutPanel.tsx'

interface Props {
  onAboutToggle: () => void
  isAboutOpen: boolean
}

export function Header({ onAboutToggle, isAboutOpen }: Props) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-row">
          <div>
            <h1 className="header-title">CitizenFirst</h1>
            <p className="header-subtitle">Discover what you're entitled to</p>
          </div>
          <button
            className="header-about-btn"
            onClick={onAboutToggle}
            aria-expanded={isAboutOpen}
          >
            {isAboutOpen ? 'Close' : 'About'}
          </button>
        </div>
      </div>
      <AboutPanel isOpen={isAboutOpen} onClose={onAboutToggle} />
    </header>
  )
}
