import type { EntitlementBundle } from '../../types/entitlements.ts'
import { TotalValueBanner } from './TotalValueBanner.tsx'
import { GatewayCard } from './GatewayCard.tsx'
import { CascadeList } from './CascadeList.tsx'
import { EntitlementCard } from './EntitlementCard.tsx'
import { ConflictCard } from './ConflictCard.tsx'

interface Props {
  bundle: EntitlementBundle
}

export function BundleView({ bundle }: Props) {
  const hasResults =
    bundle.gateway_entitlements.length > 0 ||
    bundle.independent_entitlements.length > 0 ||
    bundle.cascaded_entitlements.length > 0

  if (!hasResults) {
    return (
      <div className="bundle-empty">
        <p>We couldn't identify specific entitlements based on the information provided.</p>
        <p>
          We'd recommend checking with{' '}
          <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer">
            Citizens Advice
          </a>{' '}
          for a more detailed assessment.
        </p>
      </div>
    )
  }

  return (
    <div className="bundle-view" aria-label="Your entitlements bundle">
      <div className="bundle-header-row">
        <h2 className="bundle-heading">Based on what you've told us, here's what you may be entitled to:</h2>
        <button className="print-btn" onClick={() => window.print()}>
          Print / save as PDF
        </button>
      </div>

      <TotalValueBanner
        low={bundle.total_estimated_annual_value.low}
        high={bundle.total_estimated_annual_value.high}
      />

      {bundle.gateway_entitlements.length > 0 && (
        <section className="bundle-section" aria-label="Gateway benefits — start here">
          {bundle.gateway_entitlements.map((gw) => (
            <div key={gw.id}>
              <GatewayCard entitlement={gw} />
              {bundle.cascaded_entitlements
                .filter((g) => g.gateway_id === gw.id)
                .map((group) => (
                  <CascadeList key={group.gateway_id} group={group} />
                ))}
            </div>
          ))}
        </section>
      )}

      {bundle.independent_entitlements.length > 0 && (
        <section className="bundle-section" aria-label="Additional entitlements">
          <h3 className="bundle-section-heading">Also worth claiming</h3>
          {bundle.independent_entitlements.map((ent) => (
            <EntitlementCard key={ent.id} entitlement={ent} />
          ))}
        </section>
      )}

      {bundle.conflicts.length > 0 && (
        <section className="bundle-section" aria-label="Choices to make">
          <h3 className="bundle-section-heading">Choices to make</h3>
          {bundle.conflicts.map((conflict, i) => (
            <ConflictCard key={i} conflict={conflict} />
          ))}
        </section>
      )}
    </div>
  )
}
