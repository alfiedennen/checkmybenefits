interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AboutPanel({ isOpen, onClose }: Props) {
  if (!isOpen) return null

  return (
    <div className="about-panel" role="region" aria-label="About Check My Benefits">
      <div className="about-panel-inner">
        <div className="about-panel-header">
          <h2 className="about-panel-title">About Check My Benefits</h2>
        </div>

        <div className="about-panel-content">
          <div className="about-panel-section">
            <h3>What it does</h3>
            <p>
              Check My Benefits helps UK citizens discover benefits, grants, and support they may be
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
              All eligibility rules are based on published GOV.UK criteria and official benefit
              rates for 2025-26.
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
              <li>Covers 52 UK entitlements across any life situation</li>
              <li>Does not replace Citizens Advice or professional advisers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
