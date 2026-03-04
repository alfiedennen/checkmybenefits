import { EvidenceCallout } from '../EvidenceCallout.tsx'

export function TeamsSection() {
  return (
    <section id="teams" className="cs-section">
      <p className="cs-section-label">5. Bringing Teams Together</p>
      <h2 className="cs-section-title">Shared artefacts, not shared meetings</h2>

      <div className="cs-section-body">
        <p>
          Cross-cutting technology fails when every team builds its own version of truth.
          The solution is a shared artefact, not more governance.
        </p>
      </div>

      <EvidenceCallout label="In practice: influence without authority across departments">
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Embed, don't mandate.</strong> Place product people inside departmental
            teams for 2 to 3 days. They learn the domain; the department sees the triage
            layer working with their rules. Co-creation beats specification.</li>
          <li><strong>Make contribution low-friction.</strong> If a department wants to update an
            eligibility rule, it shouldn't require a change request board. A PR with a
            test case is faster, more transparent, and self-documenting.</li>
          <li><strong>Shared dashboards, not shared reports.</strong> Every team can see the same
            outcome metrics: repeat contact, cascade completion, triage accuracy by
            journey. Transparency creates accountability without hierarchy.</li>
          <li><strong>Governance through test suites.</strong> Instead of a governance board that
            meets monthly, a test suite that runs on every change. Departments see
            immediately if their rule change breaks something downstream. The feedback
            loop is minutes, not weeks.</li>
          <li><strong>Suppliers as contributors, not contractors.</strong> If suppliers are already
            building, give them the entitlement model as a shared dependency. Their work
            becomes compatible by default, not by negotiation.</li>
        </ul>
      </EvidenceCallout>

      <div className="cs-section-body">
        <p>
          <strong>Standards through practice.</strong> At DBT, we built the offboarding
          service with vendor-agnostic code and audit trails in formats the data team
          could consume directly. Governance that runs in continuous integration, not in meetings.
        </p>
        <p>
          <strong>Speak the right language to the right audience.</strong> With engineers:
          trade-offs and architecture. With policy: "here's what rule X means for citizen Y."
          With operations: reduction in repeat contact, first-contact resolution.
        </p>
      </div>

      <EvidenceCallout label="Evidence: what automated governance looks like">
        <pre>{`Every push:    458 deterministic tests
Weekly:        105 single-turn + 23 multi-turn AI evals
Weekly:        GOV.UK benefit rate fetch, validate, auto-commit
Daily:         DWP Atom feed monitor for new publications`}</pre>
        <p style={{ marginTop: '8px' }}>
          134 entitlement matrix tests cover all 75 entitlements across 3 nations.
          Rate validation checks parsed values against expected ranges before committing.
        </p>
      </EvidenceCallout>

      <div className="cs-section-body">
        <p>
          <strong>Departments own their rules. The cascade map connects them.</strong> DWP
          knows UC. HMRC owns Child Benefit. The entitlement model is where
          the connections live, not in anyone's head or a governance board.
          Open by default: CC0 public domain. Departments can inspect every rule,
          fork the model, contribute corrections.
        </p>
      </div>
    </section>
  )
}
