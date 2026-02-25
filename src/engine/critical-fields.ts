import type { PersonData } from '../types/person.ts'

/**
 * Check that we have the minimum fields needed to produce useful results.
 * Only gates on fields that heavily affect eligibility outcomes.
 * Age and relationship_status have sensible defaults in eligibility rules.
 */
export function hasCriticalFields(person: PersonData): boolean {
  return !!(
    person.employment_status &&
    person.income_band &&
    person.housing_tenure &&
    person.postcode &&
    person.age
  )
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
  if (!person.postcode) missing.push('your postcode')
  if (missing.length === 0) return 'a few more details'
  if (missing.length === 1) return missing[0]
  return missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1]
}
