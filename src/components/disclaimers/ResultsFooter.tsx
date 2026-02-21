import benefitRates from '../../data/benefit-rates.json'

export function ResultsFooter() {
  return (
    <div className="results-footer" role="contentinfo">
      <p>
        <strong>We try to be thorough, but we can't cover everything.</strong> There may be
        local schemes, discretionary funds, or entitlements we've missed. Our estimates are
        based on {benefitRates.tax_year} benefit rates and may not reflect recent changes.
      </p>
      <p>For detailed advice tailored to your circumstances:</p>
      <ul>
        <li>
          <strong>Citizens Advice</strong> —{' '}
          <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer">
            citizensadvice.org.uk
          </a>{' '}
          or call 0800 144 8848
        </li>
        <li>
          <strong>Turn2us</strong> —{' '}
          <a href="https://www.turn2us.org.uk" target="_blank" rel="noopener noreferrer">
            turn2us.org.uk
          </a>{' '}
          (benefits calculator and grants search)
        </li>
        <li>
          <strong>entitledto</strong> —{' '}
          <a href="https://www.entitledto.co.uk" target="_blank" rel="noopener noreferrer">
            entitledto.co.uk
          </a>{' '}
          (detailed benefits calculator)
        </li>
        <li>
          <strong>Your local council</strong> — for Council Tax Support, Discretionary
          Housing Payments, and local welfare assistance
        </li>
      </ul>
      <p className="results-footer-send">
        <em>For SEND support specifically:</em>
      </p>
      <ul>
        <li>
          <strong>IPSEA</strong> —{' '}
          <a href="https://www.ipsea.org.uk" target="_blank" rel="noopener noreferrer">
            ipsea.org.uk
          </a>{' '}
          (free legally-based SEND advice)
        </li>
        <li>
          <strong>SOS!SEN</strong> —{' '}
          <a href="https://www.sossen.org.uk" target="_blank" rel="noopener noreferrer">
            sossen.org.uk
          </a>{' '}
          (SEND advice and tribunal support)
        </li>
      </ul>
    </div>
  )
}
