import { EvidenceCallout } from '../EvidenceCallout.tsx'

export function TeamsSection() {
  return (
    <section id="teams" className="cs-section">
      <p className="cs-section-label">5. Bringing Teams Together</p>
      <h2 className="cs-section-title">Shared artefacts, not shared meetings</h2>

      <EvidenceCallout label="In practice: influence without authority across departments">
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Embed, don't mandate.</strong> Place product people inside departmental
            teams for 2 to 3 days. They learn the domain; the department sees the triage
            layer working with their rules. Co-creation beats specification.</li>
          <li><strong>Make contribution low-friction.</strong> If a department wants to update an
            eligibility rule, it shouldn't require a change request board. A pull request
            with a test case is faster, more transparent, and self-documenting.</li>
          <li><strong>Shared dashboards, not shared reports.</strong> Every team can see the same
            outcome metrics: repeat contact, cascade completion, triage accuracy by
            journey. Transparency creates accountability without hierarchy.</li>
          <li><strong>Governance through test suites.</strong> Instead of a governance board that
            meets monthly, a test suite that runs on every change. Departments see
            immediately if their rule change breaks something downstream. The feedback
            loop is minutes, not weeks.</li>
          <li><strong>Speak the right language to the right audience.</strong> With engineers:
            trade-offs and architecture. With policy: "here's what rule X means for citizen Y."
            With operations: reduction in repeat contact, first-contact resolution.</li>
        </ul>
      </EvidenceCallout>

      <div className="cs-section-body">
        <p>
          <strong>ScottishPower:</strong> Delivering the app required coordination across
          digital, contact centre operations, brand, and data teams. The shared artefact
          was the customer journey itself: everyone could see how their piece connected
          to the customer experience. Suppliers contributed to a shared model, not
          isolated deliverables.
        </p>
        <p>
          <strong>DBT:</strong> We built the offboarding service with vendor-agnostic
          code and audit trails in formats the data team could consume directly. Standards
          came from practice, not committee. The service worked across HR, IT, payroll, and
          facilities because the integration layer was the shared artefact.
        </p>
      </div>

      <EvidenceCallout label="Evidence: what automated governance looks like">
        <pre>{`Every push:    458 deterministic tests
Weekly:        105 single-turn + 23 multi-turn AI evals
Weekly:        GOV.UK benefit rate fetch, validate, auto-commit
Daily:         DWP Atom feed monitor for new publications`}</pre>
        <p style={{ marginTop: '8px' }}>
          Departments own their rules. DWP knows Universal Credit. HMRC owns Child Benefit.
          The entitlement model is where the connections live, not in anyone's head or a
          governance board. 134 matrix tests cover all 75 entitlements across 3 nations.
          Open by default: CC0 public domain.
        </p>
      </EvidenceCallout>
    </section>
  )
}
