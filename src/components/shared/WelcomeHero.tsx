interface Props {
  onGetStarted: () => void
}

export function WelcomeHero({ onGetStarted }: Props) {
  return (
    <section className="welcome-hero" aria-label="Welcome to CitizenFirst">
      <div className="welcome-hero-inner">
        <h2 className="welcome-hero-title">
          Find out what benefits and support you could be getting
        </h2>
        <p className="welcome-hero-description">
          CitizenFirst helps you discover government benefits, grants, and support you may be
          entitled to — based on your situation, not a 50-page form.
        </p>

        <div className="welcome-hero-steps">
          <h3 className="welcome-hero-section-heading">How it works</h3>
          <ol className="welcome-hero-step-list">
            <li className="welcome-hero-step">
              <span className="welcome-hero-step-number">1</span>
              <div>
                <strong>Tell us your situation</strong>
                <p>Pick from a common life event, or describe what's going on in your own words.</p>
              </div>
            </li>
            <li className="welcome-hero-step">
              <span className="welcome-hero-step-number">2</span>
              <div>
                <strong>Answer a few questions</strong>
                <p>We'll ask about your household, income, and housing — just enough to check eligibility.</p>
              </div>
            </li>
            <li className="welcome-hero-step">
              <span className="welcome-hero-step-number">3</span>
              <div>
                <strong>Get your personalised results</strong>
                <p>See what you could claim, how much it's worth, and exactly how to apply — in the right order.</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="welcome-hero-covers">
          <h3 className="welcome-hero-section-heading">Common situations people ask about</h3>
          <ul className="welcome-hero-situations">
            <li>Caring for a family member</li>
            <li>Having a baby or young children</li>
            <li>A child with additional needs</li>
            <li>Lost your job or reduced income</li>
            <li>Health condition or disability</li>
            <li>Bereavement or separation</li>
            <li>And many more...</li>
          </ul>
        </div>

        <div className="welcome-hero-limitations">
          <h3 className="welcome-hero-section-heading">Good to know</h3>
          <ul className="welcome-hero-limitations-list">
            <li>This is guidance, not formal benefits advice</li>
            <li>We can't guarantee eligibility — results are estimates based on what you tell us</li>
          </ul>
        </div>

        <button className="welcome-hero-cta" onClick={onGetStarted}>
          Get started
        </button>
      </div>
    </section>
  )
}
