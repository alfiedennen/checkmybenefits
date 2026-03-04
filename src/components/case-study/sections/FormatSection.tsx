export function FormatSection() {
  return (
    <section id="format" className="cs-section">
      <p className="cs-section-label">About this presentation</p>
      <h2 className="cs-section-title">You're looking at the product</h2>

      <div className="cs-section-body">
        <p>
          This page is part of <a href="https://checkmybenefits.uk">checkmybenefits.uk</a>, a
          working intelligent triage system I built to help UK citizens discover what
          benefits they're entitled to. It's live, it's free, and it covers 75
          entitlements across England, Wales, and Scotland.
        </p>
        <p>
          Rather than a slide deck, I'm using the product itself to answer the brief.
          Each section below maps to what you asked for:
        </p>
      </div>

      <div className="cs-lens-grid">
        <div className="cs-lens-card">
          <h3>1. Diagnosing the problem</h3>
          <p>Four lenses, grounded in 5 years of government delivery</p>
        </div>
        <div className="cs-lens-card">
          <h3>2. Aligning stakeholders</h3>
          <p>What I've learned about trust, trade-offs, and shared artefacts</p>
        </div>
        <div className="cs-lens-card">
          <h3>3. Product strategy</h3>
          <p>From department-centric to situation-centric, with a live demo</p>
        </div>
        <div className="cs-lens-card">
          <h3>4. Bringing teams together</h3>
          <p>Standards through practice, not committee</p>
        </div>
      </div>

      <div className="cs-section-body">
        <p>
          Plus: first three decisions, what I'm deliberately not doing yet,
          and a live demo you can try yourself.
        </p>
      </div>
    </section>
  )
}
