import { EvidenceCallout } from '../EvidenceCallout.tsx'

export function StakeholdersSection() {
  return (
    <section id="stakeholders" className="cs-section">
      <p className="cs-section-label">3. Aligning Stakeholders</p>
      <h2 className="cs-section-title">Show the work</h2>

      <EvidenceCallout label="In practice: aligning a divided senior leadership">
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Frame around the shared problem, not competing solutions.</strong> senior leadership divides
            when each director defends their team's approach. Reframe: "We all agree on the
            problem: £X in failure demand, Y% repeat contact. Let's agree on how we'd know if
            we've solved it, then work back to approach."</li>
          <li><strong>Make the trade-offs a decision matrix, not a debate.</strong> Present options
            with costs, timelines, risks, and reversibility. "Option A gives us speed but less
            precision. Option B gives precision but takes 6 months longer. Which matters more
            for the first iteration?"</li>
          <li><strong>Give ops a seat at the table early.</strong> Operations worry about disruption
            because they're usually told about changes, not consulted. Involve contact centre leads
            in the diagnosis phase. They become advocates, not blockers.</li>
          <li><strong>Contain the blast radius for digital/suppliers.</strong> If teams are already
            building without alignment, don't stop them. Redirect. "Keep building, but build
            against this shared outcome metric. Here's the test suite that tells us if it works."</li>
          <li><strong>Two-week show-and-tells.</strong> Nothing aligns people like a working thing
            they can react to. Fortnightly demos with senior leadership create a cadence of decision-making
            that replaces big-bang strategy sign-off.</li>
        </ul>
      </EvidenceCallout>

      <div className="cs-section-body">
        <p>
          <strong>At DBT, we built and scaled Assist from 12 users to over 3,000.</strong> The
          most pivotal alignment tool wasn't the prototype. It was rapid user research:
          surfacing real quotes and experiences that were basically inarguable.
        </p>
        <p>
          <strong>Stakeholders won't champion what they can't defend.</strong> Civil
          servants stake their credibility on a tool's output. If it can't survive
          a parliamentary question, an FOI request, or a select committee, they won't back it. A
          deterministic rules engine isn't just a tech choice. It's what gets
          policy leads and ops directors to say yes.
        </p>
      </div>

      <div className="cs-section-body">
        <p>
          <strong>Name the trade-offs explicitly.</strong> Precision vs speed.
          Central platform vs departmental ownership. Conversational vs form-based.
          Implicit disagreement creates resistance. Explicit trade-offs create design decisions.
        </p>
      </div>
    </section>
  )
}
