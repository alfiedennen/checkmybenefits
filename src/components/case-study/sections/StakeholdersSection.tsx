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
          <li><strong>Make the trade-offs a decision matrix, not a debate.</strong> Present options
            with costs, timelines, risks, and reversibility. "Option A gives us speed but less
            precision. Option B gives precision but takes 6 months longer. Which matters more
            for the first iteration?"</li>
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
          <strong>DBT:</strong> We built and scaled Assist from 12 users to over 3,000.
          The most pivotal alignment tool wasn't the prototype. It was rapid user research:
          surfacing real quotes and experiences that were basically inarguable. Stakeholder
          objections dissolve when you're presenting what real people said, not what your
          team thinks.
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
