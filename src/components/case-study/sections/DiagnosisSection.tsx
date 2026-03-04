import { EvidenceCallout } from '../EvidenceCallout.tsx'

export function DiagnosisSection() {
  return (
    <section id="diagnosis" className="cs-section">
      <p className="cs-section-label">2. Diagnosing the Problem</p>
      <h2 className="cs-section-title">Start with the evidence, not the solution</h2>

      <EvidenceCallout label="In practice: how I'd run this diagnosis inside a department">
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Week 1:</strong> Shadow contact centre staff. Listen to 50 calls, categorise failure demand by type</li>
          <li><strong>Week 1-2:</strong> Map the top 5 customer journeys end-to-end with service designers, including handoffs between departments</li>
          <li><strong>Week 2:</strong> Pull management information: repeat contact rates, average handling time, top call reasons, digital abandonment points</li>
          <li><strong>Week 2-3:</strong> Interview policy leads to understand intent vs what's actually delivered</li>
          <li><strong>Week 3:</strong> Audit existing tech: what's been built, what's in flight, where suppliers are already committed</li>
          <li><strong>Output:</strong> A diagnosis document that names the root causes, not the symptoms. Shared with senior leadership before proposing solutions</li>
        </ul>
      </EvidenceCallout>

      <div className="cs-section-body">
        <p>
          <strong>ScottishPower:</strong> Everyone assumed the problem was poor
          communications around direct debit reassessment. The actual diagnosis:
          customers had no visibility into their consumption, no control over their
          direct debit, and no motivation to self-serve. The problem wasn't the
          message. It was the absence of any self-service capability.
        </p>
        <p>
          <strong>DBT offboarding:</strong> Everyone assumed we needed a better form.
          We shadowed the teams and found the real problem: fragmented systems with no
          integration. Cross-government research from GDS showed the leaver themselves
          should initiate the process, since they hold the most up-to-date information
          about themselves. The root cause wasn't process design. It was system architecture.
        </p>
        <p>
          <strong>Benefits triage:</strong> The same diagnostic pattern. The problem isn't
          better benefit pages. It's that organising by department instead of by citizen
          situation creates structural failure demand. Nobody has mapped the connections
          between entitlements.
        </p>
      </div>

      <EvidenceCallout label="Evidence: diagnostic method applied to checkmybenefits">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Method</th>
              <th>Finding</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>What are people entitled to?</td>
              <td>GOV.UK Content API, legislation</td>
              <td>75 entitlements, 7 departments, 3 nations</td>
            </tr>
            <tr>
              <td>What connects them?</td>
              <td>Policy analysis</td>
              <td>45 dependency edges, 5 conflict pairs</td>
            </tr>
            <tr>
              <td>Why do people miss out?</td>
              <td>DWP data, existing tool analysis</td>
              <td>Fragmentation, no cascade visibility</td>
            </tr>
            <tr>
              <td>What already exists?</td>
              <td>Comparative analysis</td>
              <td>Good calculators, but siloed and form-based</td>
            </tr>
          </tbody>
        </table>
      </EvidenceCallout>
    </section>
  )
}
