import { EvidenceCallout } from '../EvidenceCallout.tsx'

export function StrategySection() {
  return (
    <section id="strategy" className="cs-section">
      <p className="cs-section-label">4. Product Strategy</p>
      <h2 className="cs-section-title">From features and fixes to measurable outcomes</h2>

      <EvidenceCallout label="In practice: value, risks, and sequencing">
        <p><strong>Value hypotheses:</strong></p>
        <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
          <li>Intelligent triage reduces "am I eligible?" contact volume by 20–40% on target journeys</li>
          <li>Cascade visibility increases multi-benefit uptake</li>
          <li>Conversational intake reaches people who abandon form-based tools</li>
        </ul>
        <p><strong>Key risks:</strong></p>
        <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
          <li>Accuracy: triage that gets it wrong erodes trust faster than no triage at all. Mitigate with deterministic rules + test suite, not AI-only</li>
          <li>Departmental ownership: who maintains the eligibility rules when policy changes? Mitigate by embedding with departments, making contribution easy</li>
          <li>Scope creep: pressure to become "the platform" instead of a triage layer. Mitigate with a clear boundary. We surface and sequence, we don't calculate or process</li>
        </ul>
        <p><strong>Sequencing:</strong></p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Month 1: One life event prototype, validated with real users and contact centre staff</li>
          <li>Month 2–3: Expand to 3 life events, instrument for outcomes, begin departmental engagement on rule contribution</li>
          <li>Month 4–6: Scale based on evidence. Only invest in what's proven to reduce failure demand</li>
        </ul>
      </EvidenceCallout>

      <div className="cs-section-body">
        <p>
          <strong>ScottishPower:</strong> The strategic shift was from reactive contact
          centre servicing to proactive self-service. We built an app with a rules engine
          and behavioural nudges. Consumption data drove personalised "next best actions"
          instead of generic communications. Use data to anticipate what someone needs,
          then surface it before they have to call.
        </p>
        <p>
          <strong>DBT:</strong> We had diverged from i.AI's Redbox a year before the
          rebrand to Assist. The strategic shift was building a tools architecture:
          instead of one monolithic chat product, discrete tools solving specific needs.
          Investment research, submissions checking, negotiation planning. Each tool is
          a measurable outcome. The architecture supports any number of them without
          rebuilding the platform.
        </p>
      </div>

      <div className="cs-from-to">
        <div className="cs-from-to-item">
          <span className="cs-from-to-arrow">&rarr;</span>
          <span className="cs-from-to-from">Department-centric</span>
          <span className="cs-from-to-to">Situation-centric (life events)</span>
        </div>
        <div className="cs-from-to-item">
          <span className="cs-from-to-arrow">&rarr;</span>
          <span className="cs-from-to-from">Form-based calculators</span>
          <span className="cs-from-to-to">Conversational intake</span>
        </div>
        <div className="cs-from-to-item">
          <span className="cs-from-to-arrow">&rarr;</span>
          <span className="cs-from-to-from">Flat benefit lists</span>
          <span className="cs-from-to-to">Gateway cascades with sequencing</span>
        </div>
        <div className="cs-from-to-item">
          <span className="cs-from-to-arrow">&rarr;</span>
          <span className="cs-from-to-from">Features shipped</span>
          <span className="cs-from-to-to">Outcomes measured</span>
        </div>
      </div>

      <div className="cs-section-body">
        <p>
          <strong>The cascade in action.</strong> One gateway claim can unlock
          &pound;3,000–5,000+/year in additional entitlements:
        </p>
      </div>

      <div className="cs-cascade-demo">
        <h3>Pension Credit (GATEWAY, claim first)</h3>
        <ul>
          <li>Council Tax Reduction (up to 100%)</li>
          <li>Housing Benefit</li>
          <li>Warm Home Discount (&pound;150/year)</li>
          <li>Free NHS Prescriptions</li>
          <li>Free NHS Dental Treatment</li>
          <li>Free NHS Sight Tests</li>
          <li>NHS Travel Cost Refunds</li>
          <li>Cold Weather Payment</li>
          <li>Free TV Licence (75+)</li>
        </ul>
      </div>

      <div className="cs-architecture">
{`User message (natural language)
  → AI model (Nova Lite)       understands "my mum can't cope"
  → Code extraction            regex fallback for postcodes, ages, income
  → Rules engine (48 rules)    deterministic, auditable, testable
  → Cascade resolver            groups by gateway dependency
  → Personalised bundle         prioritised action plan`}
      </div>

      <EvidenceCallout label="Evidence: test and eval framework">
        <table>
          <thead>
            <tr><th>Layer</th><th>Count</th><th>What it tests</th></tr>
          </thead>
          <tbody>
            <tr><td>Deterministic (Vitest)</td><td>458</td><td>Engine, extraction, postcodes, guardrails</td></tr>
            <tr><td>Single-turn AI evals</td><td>105</td><td>AI extraction across 21 categories</td></tr>
            <tr><td>Multi-turn AI evals</td><td>23</td><td>Full conversation, gate compliance</td></tr>
            <tr><td>Guardrail evals</td><td>34</td><td>Off-topic redirection, on-topic engagement</td></tr>
          </tbody>
        </table>
        <p style={{ marginTop: '8px' }}>
          Benefit rates auto-update weekly via GOV.UK Content API.
          DWP Atom feed monitor triggers updates on new publications.
        </p>
      </EvidenceCallout>
    </section>
  )
}
