import { EvidenceCallout } from '../EvidenceCallout.tsx'

export function DecisionsSection() {
  return (
    <section id="decisions" className="cs-section">
      <p className="cs-section-label">6. First Three Decisions</p>
      <h2 className="cs-section-title">What I'd do first</h2>

      <ol className="cs-decision-list">
        <li className="cs-decision-item">
          <span className="cs-decision-number">1</span>
          <div className="cs-decision-content">
            <h3>Working prototype on one life event in 4 weeks</h3>
            <p>
              Pick the highest-pain journey from contact volume data.
              A working prototype creates alignment faster than any strategy document.
            </p>
          </div>
        </li>
        <li className="cs-decision-item">
          <span className="cs-decision-number">2</span>
          <div className="cs-decision-content">
            <h3>Publish the entitlement model as shared infrastructure</h3>
            <p>
              Eligibility rules, dependencies, and cascades in one structured dataset.
              Departments contribute their rules; we maintain the connections.
            </p>
          </div>
        </li>
        <li className="cs-decision-item">
          <span className="cs-decision-number">3</span>
          <div className="cs-decision-content">
            <h3>Instrument for outcomes, not outputs</h3>
            <p>
              Entitlements surfaced, cascade completion, time to first claim,
              reduction in repeat contact. Not features shipped.
            </p>
          </div>
        </li>
      </ol>

      <EvidenceCallout label="In practice: decision-making method">
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Decision 1 method:</strong> Pull contact centre management information to rank life events by
            failure demand volume. Cross-reference with policy priority (ministerial interest,
            NAO reports, select committee recommendations). Pick the journey where pain is
            highest and political cover is strongest. Prototype with real users and contact
            centre staff, not in isolation.</li>
          <li><strong>Decision 2 method:</strong> Start with what's publicly available (GOV.UK
            eligibility criteria, benefit rates). Don't wait for departmental buy-in to start
            modelling. Build the first version from open data, then invite departments to
            correct and contribute. Ownership follows contribution.</li>
          <li><strong>Decision 3 method:</strong> Define 3 to 4 outcome metrics with ops leads
            before building anything. Baseline them in week 1. Report against them fortnightly.
            If the prototype doesn't move the metrics, change the approach. Don't scale it.</li>
        </ul>
        <p style={{ marginTop: '8px' }}>
          The common thread: use evidence to make decisions, not consensus. Consensus is slow
          and optimises for comfort. Evidence-led decisions can be challenged, tested, and
          reversed. That makes them faster and safer.
        </p>
      </EvidenceCallout>

      <div className="cs-not-yet">
        <h3>What I'm explicitly not doing yet</h3>
        <ul>
          <li><strong>Building a mega-platform.</strong> Start focused, scale with evidence</li>
          <li><strong>Replacing departmental systems.</strong> Triage sits in front, not instead</li>
          <li><strong>Full means-testing.</strong> Heuristic triage first, specialist tools for precision</li>
          <li><strong>Northern Ireland.</strong> Separate system, add after proving the model</li>
          <li><strong>Multi-year roadmap.</strong> Commit to 4 weeks, hypothesis for 3 months</li>
        </ul>
      </div>

      <EvidenceCallout label="Evidence: this approach in action on checkmybenefits">
        <p>
          checkmybenefits.uk was built following exactly this pattern: start from open data
          (GOV.UK Content API), build the entitlement model, instrument for accuracy (96.1%),
          iterate based on eval results. The offboarding service at DBT followed the same
          arc. Alpha proved APIs worked, beta caught adoption barriers, then scale.
        </p>
      </EvidenceCallout>
    </section>
  )
}
