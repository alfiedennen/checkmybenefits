import benefitRates from '../../data/benefit-rates.json'

export function StaleDataWarning() {
  const taxYear = benefitRates.tax_year
  const [startYear] = taxYear.split('-').map(Number)
  const endYear = startYear + 1

  // Tax year runs April to April. If current date is after April of the end year,
  // the data is stale.
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-indexed

  // Data is from 2024-25, stale if we're past April 2025
  const isStale = currentYear > 2000 + endYear || (currentYear === 2000 + endYear && currentMonth >= 4)

  if (!isStale) return null

  const currentTaxYear = currentMonth >= 4
    ? `${currentYear}-${(currentYear + 1).toString().slice(2)}`
    : `${currentYear - 1}-${currentYear.toString().slice(2)}`

  return (
    <div className="stale-data-warning" role="alert">
      <strong>Note:</strong> The benefit rates used in these estimates are from the {taxYear} tax
      year. Updated rates for {currentTaxYear} may differ. Check GOV.UK for current rates.
    </div>
  )
}
