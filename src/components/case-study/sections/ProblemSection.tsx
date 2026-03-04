import { EvidenceCallout } from '../EvidenceCallout.tsx'

export function ProblemSection() {
  return (
    <section id="problem" className="cs-section">
      <p className="cs-section-label">1. The Problem</p>
      <h2 className="cs-section-title">The system doesn't tell people what they're entitled to</h2>

      <div className="cs-stat-banner">
        <div className="cs-stat-banner-value">&pound;24 billion</div>
        <div className="cs-stat-banner-label">unclaimed annually &middot; 7M+ households &middot; avg &pound;3,428/year</div>
        <div className="cs-stat-banner-source">Policy in Practice, Missing Out 2025</div>
      </div>

      <div className="cs-lens-grid">
        <div className="cs-lens-card">
          <h3>Policy intent</h3>
          <p>Entitlements exist in law. Intent gets lost between statute, departments, and the citizen.</p>
        </div>
        <div className="cs-lens-card">
          <h3>Customer journeys</h3>
          <p>7+ websites, 20+ forms, multiple phone calls. Each department sees only its slice.</p>
        </div>
        <div className="cs-lens-card">
          <h3>Operational constraints</h3>
          <p>Contact centres overwhelmed with "am I eligible?" calls that could be triaged automatically.</p>
        </div>
        <div className="cs-lens-card">
          <h3>Tech landscape</h3>
          <p>Existing calculators are useful but fragmented, form-based, and department-centric.</p>
        </div>
      </div>

      <div className="cs-section-body">
        <p>
          <strong>This pattern recurs.</strong> At ScottishPower, direct debit reassessment
          was creating massive contact centre strain and driving customer loss. Over 70% of
          customers ended up outside their direct debit, with £300 million in outstanding
          debit on accounts. Customers had no visibility, no control, and no reason to
          self-serve.
        </p>
        <p>
          At DBT, line managers were spending up to 15 hours offboarding a single leaver,
          chasing payroll, IT, and facilities across separate systems. HR had effectively
          abdicated responsibility, pushing everything onto managers.
        </p>
        <p>
          The common thread: fragmented systems create failure demand. The people who
          need the service can't navigate it. The people delivering the service are
          overwhelmed by avoidable contact.
        </p>
      </div>

      <EvidenceCallout label="Evidence: entitlement mapping approach">
        <ul style={{ paddingLeft: '20px' }}>
          <li>GOV.UK Content API for all benefit rate tables (no auth, 10 req/s)</li>
          <li>45 dependency edges mapped between entitlements</li>
          <li>5 mutually exclusive benefit pairs with resolution logic</li>
          <li>Cross-referenced DWP unfulfilled eligibility data (FYE 2025: &pound;3.7bn)</li>
          <li>Gap analysis of entitledto, Turn2Us, GOV.UK tools</li>
        </ul>
      </EvidenceCallout>
    </section>
  )
}
