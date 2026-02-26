import type { PersonData } from '../types/person.ts'

/**
 * Apply safe defaults for homeless users who may not have a postcode
 * or employment status. Modifies the person object in place and returns it.
 */
export function applyHomelessDefaults(person: PersonData): PersonData {
  if (person.housing_tenure !== 'homeless') return person
  // Homeless users are almost always unemployed with zero income
  if (!person.employment_status) person.employment_status = 'unemployed'
  if (!person.income_band) {
    person.income_band = 'under_7400'
    person.gross_annual_income = person.gross_annual_income ?? 0
  }
  return person
}

/**
 * Check that we have the minimum fields needed to produce useful results.
 * Only gates on fields that heavily affect eligibility outcomes.
 * Age and relationship_status have sensible defaults in eligibility rules.
 *
 * Homeless users get a relaxed gate: postcode is not required since they
 * may not have a fixed address.
 */
export function hasCriticalFields(person: PersonData): boolean {
  const isHomeless = person.housing_tenure === 'homeless'
  const baseFields = !!(
    person.employment_status &&
    person.income_band &&
    person.housing_tenure &&
    person.age
  )
  // Homeless users don't need a postcode — default to England
  if (isHomeless) return baseFields
  return baseFields && !!person.postcode
}

/**
 * Detect when the AI writes completion-sounding text but forgets the
 * <stage_transition>complete</stage_transition> XML tag.
 */
export function looksLikeCompletion(text: string): boolean {
  const patterns = [
    /take a look below/i,
    /found.*(?:things|support|entitlements?).*(?:may|might|could)\s+(?:be\s+)?(?:entitled|eligible|qualify)/i,
    /start\s+here/i,
    /here\s+are\s+(?:your|the)\s+results/i,
    /results\s+(?:are\s+)?(?:below|ready)/i,
    /(?:I have|I've)\s+found\s+several/i,
    /display\s+(?:it\s+)?below/i,
    /(?:you|it looks like you)\s+may\s+be\s+eligible/i,
    /here\s+are\s+some\s+(?:potential|possible)/i,
    /(?:Attendance Allowance|Pension Credit|Universal Credit|Carer's Allowance|Child Benefit|Housing Benefit|PIP).*(?:you|eligible|qualify|entitled)/i,
  ]
  return patterns.some((p) => p.test(text))
}

export function getMissingFields(person: PersonData): string {
  const missing: string[] = []
  if (!person.employment_status) missing.push('your employment situation')
  if (!person.income_band) missing.push('your approximate household income')
  if (!person.housing_tenure) missing.push('your housing situation (renting, own home, etc.)')
  if (!person.age) missing.push('your age')
  // Homeless users don't need a postcode
  if (!person.postcode && person.housing_tenure !== 'homeless') missing.push('your postcode')
  if (missing.length === 0) return 'a few more details'
  if (missing.length === 1) return missing[0]
  return missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1]
}
