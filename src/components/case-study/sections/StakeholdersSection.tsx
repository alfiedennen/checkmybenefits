import { EvidenceCallout } from '../EvidenceCallout.tsx'

export function StakeholdersSection() {
  return (
    <section id="stakeholders" className="cs-section">
      <p className="cs-section-label">3. Aligning Stakeholders</p>
      <h2 className="cs-section-title">Show the work</h2>

      <EvidenceCallout label="In practice: aligning a divided senior leadership">
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Frame around the shared problem, not competing solutions.</strong> Senior
            leadership divides when each director defends their team's approach. Reframe:
            "We all agree on the problem: £X in failure demand, Y% repeat contact. Let's
            agree on how we'd know if we've solved it, then work back to approach."</li>
          <li><strong>Name the trade-offs explicitly.</strong> Implicit disagreement creates
            resistance. Explicit trade-offs create design decisions. Present each one with
            costs, timelines, and reversibility:
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Precision vs speed: do we need exact eligibility or directional triage?</li>
              <li>Central platform vs departmental ownership: who maintains the rules?</li>
              <li>Conversational vs form-based: which reaches more people?</li>
            </ul>
            "Which matters more for the first iteration?" turns a debate into a decision.</li>
          <li><strong>Give ops a seat at the table early.</strong> Operations worry about disruption
            because they're usually told about changes, not consulted. Involve contact centre leads
            in the diagnosis phase. They become advocates, not blockers.</li>
          <li><strong>Two-week show-and-tells.</strong> Nothing aligns people like a working thing
            they can react to. Fortnightly demos create a cadence of decision-making
            that replaces big-bang strategy sign-off.</li>
        </ul>
      </EvidenceCallout>

      <div className="cs-section-body">
        <p>
          <strong>ScottishPower:</strong> Aligning digital, operations, brand, and data
          teams around a shared app strategy required a common language. The shared
          problem (contact centre strain from direct debit reassessment) united teams
          that otherwise had competing priorities. Framing around customer pain, not
          technology choice, got everyone moving in the same direction.
        </p>
        <p>
          <strong>DBT:</strong> The offboarding project touched HR, IT, payroll, and facilities.
          The most pivotal alignment tool was rapid user research: surfacing real quotes
          from line managers about the 15 hours they were losing per leaver. Stakeholder
          objections dissolve when you're presenting what real people said, not what your
          team thinks. To ensure HR owned the service long-term, we agreed 2.5 FTE
          responsibility for a senior HR stakeholder to act as product owner, representing
          HR needs and providing a throughline to live service ownership.
        </p>
        <p>
          <strong>Stakeholders won't champion what they can't defend.</strong> Civil
          servants stake their credibility on a tool's output. If it can't survive
          a parliamentary question, an FOI request, or a select committee, they won't
          back it. Auditability isn't just a tech requirement. It's a stakeholder
          alignment tool.
        </p>
      </div>
    </section>
  )
}
