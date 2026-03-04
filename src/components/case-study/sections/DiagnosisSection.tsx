import { EvidenceCallout } from '../EvidenceCallout.tsx'

export function DiagnosisSection() {
  return (
    <section id="diagnosis" className="cs-section">
      <p className="cs-section-label">2. Diagnosing the Problem</p>
      <h2 className="cs-section-title">Start with the evidence, not the solution</h2>

      <EvidenceCallout label="In practice: how I'd diagnose this inside a department">
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Contact volume data:</strong> which "am I eligible?" queries drive the most repeat contact? This picks the first journey to prototype</li>
          <li><strong>Digital analytics:</strong> where do citizens abandon existing online journeys? Abandonment points reveal where the system fails them</li>
          <li><strong>Caseworker interviews:</strong> what do frontline staff wish citizens knew before calling? This surfaces the triage gap</li>
          <li><strong>Policy vs delivery gap:</strong> where does policy intent ("everyone eligible should claim") diverge from operational reality? This frames the senior leadership conversation</li>
          <li><strong>Supplier landscape:</strong> what's already being built? By whom? On what assumptions? You can't align teams you haven't mapped</li>
        </ul>
        <p style={{ marginTop: '8px' }}>
          The goal is a diagnosis grounded in their own data, not external research.
          You earn the right to propose solutions by showing you understand the problem
          from their perspective.
        </p>
      </EvidenceCallout>

      <div className="cs-section-body">
        <p>
          <strong>ScottishPower:</strong> Direct debit reassessment was driving
          massive contact centre strain and customer loss. The assumption was better
          letters. The diagnosis: customers had no visibility into their consumption,
          no control over their direct debit, and no reason to self-serve. We built
          an app with usage visualisation, a direct debit adjustment tool, and proactive alerts.
          The fix was self-service, not better comms.
        </p>
        <p>
          <strong>DBT offboarding:</strong> Line managers were spending up to 15 hours
          offboarding a single leaver, chasing payroll, IT, and facilities across
          separate systems. HR had effectively abdicated responsibility, pushing
          everything onto managers. Cross-government research from GDS suggested the
          leaver themselves should initiate the process, since they hold the most
          up-to-date information about themselves. The fix wasn't a better form. It
          was integrating the APIs behind a single service, starting with the leaver.
          15 hours to under 10 minutes.
        </p>
        <p>
          <strong>Benefits triage:</strong> The same diagnostic pattern. The problem isn't
          better benefit pages. It's that organising by department instead of by citizen
          situation creates structural failure demand.
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
