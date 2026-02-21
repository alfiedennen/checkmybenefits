interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AboutPanel({ isOpen, onClose }: Props) {
  if (!isOpen) return null

  return (
    <div className="about-panel" role="region" aria-label="About CitizenFirst">
      <div className="about-panel-inner">
        <div className="about-panel-header">
          <h2 className="about-panel-title">About CitizenFirst</h2>
          <button className="about-panel-close" onClick={onClose} aria-label="Close about panel">
            Close
          </button>
        </div>

        <div className="about-panel-content">
          <div className="about-panel-section">
            <h3>What it does</h3>
            <p>
              CitizenFirst helps UK citizens discover benefits, grants, and support they may be
              entitled to. Tell us about your situation and we'll show you what to claim, in what
              order, and how to apply.
            </p>
          </div>

          <div className="about-panel-section">
            <h3>How it works behind the scenes</h3>
            <p>
              We combine AI-powered conversation with official government eligibility rules. The AI
              understands your situation in plain English, then checks your answers against published
              benefit criteria to produce personalised results.
            </p>
          </div>

          <div className="about-panel-section">
            <h3>Data sources</h3>
            <p>
              All eligibility information comes from publicly available government data, including
              GOV.UK benefit rates and rules. We use open-source policy engines where possible.
            </p>
          </div>

          <div className="about-panel-section">
            <h3>Your privacy</h3>
            <p>
              We don't store any of your information. Your conversation exists only in your browser
              and disappears when you close the page. No accounts, no tracking, no cookies.
            </p>
          </div>

          <div className="about-panel-section">
            <h3>Limitations</h3>
            <ul>
              <li>This is guidance, not formal benefits advice</li>
              <li>We can't guarantee eligibility — results are estimates</li>
              <li>Currently covers 4 life situations (more coming soon)</li>
              <li>Does not replace Citizens Advice or professional advisers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
