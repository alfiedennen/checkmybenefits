interface Props {
  onGetStarted: () => void
}

export function WelcomeHero({ onGetStarted }: Props) {
  return (
    <section className="welcome-hero" aria-label="Check My Benefits">
      <div className="welcome-hero-inner">
        <h2 className="welcome-hero-title">
          You could be missing out on thousands of pounds a year
        </h2>
        <p className="welcome-hero-description">
          Over £15 billion in UK benefits goes unclaimed every year.
          Answer a few questions and we'll show you what you could
          be getting — and exactly how to claim it.
        </p>

        <button className="welcome-hero-cta" onClick={onGetStarted}>
          Check now — it takes 2 minutes
        </button>
        <p className="welcome-hero-trust">Free · Private · No sign-up needed</p>

        <div className="welcome-hero-steps">
          <h3 className="welcome-hero-section-heading">How it works</h3>
          <ol className="welcome-hero-step-list">
            <li className="welcome-hero-step">
              <span className="welcome-hero-step-number">1</span>
              <div>
                <strong>Describe your situation</strong>
                <p>In your own words, or pick a common life event.</p>
              </div>
            </li>
            <li className="welcome-hero-step">
              <span className="welcome-hero-step-number">2</span>
              <div>
                <strong>We check 52 entitlements</strong>
                <p>Your answers are compared against official eligibility rules.</p>
              </div>
            </li>
            <li className="welcome-hero-step">
              <span className="welcome-hero-step-number">3</span>
              <div>
                <strong>Get a personalised plan</strong>
                <p>See what to claim, in what order, with steps to apply.</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="welcome-hero-covers">
          <h3 className="welcome-hero-section-heading">What we cover</h3>
          <div className="welcome-hero-chips">
            <span className="welcome-hero-chip">Income & work</span>
            <span className="welcome-hero-chip">Housing</span>
            <span className="welcome-hero-chip">Health & disability</span>
            <span className="welcome-hero-chip">Children & family</span>
            <span className="welcome-hero-chip">Carers</span>
            <span className="welcome-hero-chip">Older people</span>
          </div>
        </div>

        <div className="welcome-hero-privacy">
          <h3 className="welcome-hero-section-heading">Your privacy</h3>
          <p>
            Nothing is stored. Your conversation exists only in your browser
            and disappears when you close the page. No accounts, no tracking,
            no cookies.
          </p>
        </div>
      </div>
    </section>
  )
}
