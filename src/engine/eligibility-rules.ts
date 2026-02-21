import type { PersonData } from '../types/person.ts'
import type { EntitlementDefinition, ConfidenceTier } from '../types/entitlements.ts'
import type { SituationId } from '../types/conversation.ts'
import benefitRates from '../data/benefit-rates.json'

const SPA = benefitRates.rates.state_pension_age

export interface EligibilityResult {
  id: string
  eligible: boolean
  confidence: ConfidenceTier
  reason?: string
}

/**
 * Run deterministic eligibility checks against person data.
 * Returns whether each entitlement is eligible and at what confidence.
 */
export function checkEligibility(
  entitlements: EntitlementDefinition[],
  personData: PersonData,
  situations: SituationId[],
): EligibilityResult[] {
  return entitlements
    .map((ent) => checkSingle(ent, personData, situations))
    .filter((r) => r.eligible)
}

function checkSingle(
  ent: EntitlementDefinition,
  person: PersonData,
  situations: SituationId[],
): EligibilityResult {
  const checker = RULE_MAP[ent.id]
  if (checker) return checker(person, situations)

  // For entitlements without specific rules that made it through the situation filter,
  // default to eligible with low confidence — better to show and let user check
  return { id: ent.id, eligible: true, confidence: 'worth_checking' }
}

type RuleChecker = (person: PersonData, situations: SituationId[]) => EligibilityResult

const RULE_MAP: Record<string, RuleChecker> = {
  attendance_allowance: (person) => {
    // AA is for the person who needs care — either the user themselves or their cared-for person
    const userAge = person.age ?? 0
    const caredFor = person.cared_for_person

    // Check if cared-for person (e.g. parent) qualifies
    if (caredFor && caredFor.age >= SPA && caredFor.needs_help_daily_living) {
      return { id: 'attendance_allowance', eligible: true, confidence: 'possible' }
    }
    // Check if user themselves qualifies
    if (userAge >= SPA && person.needs_help_with_daily_living) {
      return { id: 'attendance_allowance', eligible: true, confidence: 'possible' }
    }
    return { id: 'attendance_allowance', eligible: false, confidence: 'worth_checking' }
  },

  pension_credit: (person) => {
    // PC is for pension-age people — either the user or their cared-for person
    const userAge = person.age ?? 0
    const caredFor = person.cared_for_person

    // Check if cared-for person (e.g. parent) could qualify
    if (caredFor && caredFor.age >= SPA) {
      return { id: 'pension_credit', eligible: true, confidence: 'possible' }
    }
    // Check if user themselves qualifies
    if (userAge >= SPA) {
      const weeklyIncome = (person.gross_annual_income ?? 0) / 52
      const threshold = isCoupleish(person)
        ? benefitRates.rates.pension_credit.couple_weekly
        : benefitRates.rates.pension_credit.single_weekly
      if (weeklyIncome < threshold)
        return { id: 'pension_credit', eligible: true, confidence: 'likely' }
      if (weeklyIncome < threshold * 1.2)
        return { id: 'pension_credit', eligible: true, confidence: 'possible' }
    }
    return { id: 'pension_credit', eligible: false, confidence: 'likely' }
  },

  universal_credit: (person) => {
    const age = person.age ?? 30
    if (age < 18 || age >= SPA)
      return { id: 'universal_credit', eligible: false, confidence: 'likely' }
    if ((person.household_capital ?? 0) >= 16000)
      return { id: 'universal_credit', eligible: false, confidence: 'likely' }
    // Check income band
    if (
      person.income_band === 'under_7400' ||
      person.income_band === 'under_12570' ||
      person.income_band === 'under_16000' ||
      person.income_band === 'under_25000'
    ) {
      return { id: 'universal_credit', eligible: true, confidence: 'likely' }
    }
    if (person.income_band === 'under_50270')
      return { id: 'universal_credit', eligible: true, confidence: 'possible' }
    return { id: 'universal_credit', eligible: false, confidence: 'likely' }
  },

  carers_allowance: (person) => {
    if (!person.is_carer) return { id: 'carers_allowance', eligible: false, confidence: 'likely' }
    const hours = person.carer_hours_per_week ?? 0
    if (hours >= 35) {
      // Check cared-for person has qualifying benefit
      const carerFor = person.cared_for_person
      if (carerFor) {
        const qualifying = [
          'dla_middle_care',
          'dla_higher_care',
          'pip_daily_living_standard',
          'pip_daily_living_enhanced',
          'attendance_allowance_lower',
          'attendance_allowance_higher',
        ]
        if (qualifying.includes(carerFor.disability_benefit))
          return { id: 'carers_allowance', eligible: true, confidence: 'likely' }
      }
      // If AA is being claimed for parent, CA becomes possible
      return { id: 'carers_allowance', eligible: true, confidence: 'possible' }
    }
    // Caring but under 35 hours — still worth flagging if they might increase hours
    // or if hours were underestimated (common with informal carers)
    if (hours >= 20 && person.cared_for_person?.needs_help_daily_living) {
      return { id: 'carers_allowance', eligible: true, confidence: 'worth_checking' }
    }
    return { id: 'carers_allowance', eligible: false, confidence: 'likely' }
  },

  carers_credit: (person) => {
    if (!person.is_carer) return { id: 'carers_credit', eligible: false, confidence: 'likely' }
    if ((person.carer_hours_per_week ?? 0) >= 20)
      return { id: 'carers_credit', eligible: true, confidence: 'likely' }
    // Even at lower hours, worth checking if caring for someone with significant needs
    if (person.cared_for_person?.needs_help_daily_living)
      return { id: 'carers_credit', eligible: true, confidence: 'worth_checking' }
    return { id: 'carers_credit', eligible: false, confidence: 'likely' }
  },

  child_benefit: (person) => {
    if (person.children.length > 0)
      return { id: 'child_benefit', eligible: true, confidence: 'likely' }
    // Pregnant people will be eligible once baby arrives
    if (person.is_pregnant)
      return { id: 'child_benefit', eligible: true, confidence: 'likely' }
    return { id: 'child_benefit', eligible: false, confidence: 'likely' }
  },

  council_tax_reduction_full: (person) => {
    const age = person.age ?? 0
    if (age < SPA)
      return { id: 'council_tax_reduction_full', eligible: false, confidence: 'likely' }
    return { id: 'council_tax_reduction_full', eligible: true, confidence: 'possible' }
  },

  council_tax_support_working_age: (person) => {
    const age = person.age ?? 30
    if (age >= SPA)
      return { id: 'council_tax_support_working_age', eligible: false, confidence: 'likely' }
    // 300+ schemes, can only say possible
    return { id: 'council_tax_support_working_age', eligible: true, confidence: 'possible' }
  },

  council_tax_single_person_discount: (person) => {
    if (person.relationship_status === 'single' || person.relationship_status === 'widowed')
      return { id: 'council_tax_single_person_discount', eligible: true, confidence: 'likely' }
    return { id: 'council_tax_single_person_discount', eligible: false, confidence: 'likely' }
  },

  warm_home_discount: (person) => {
    // Automatic if on PC Guarantee, also available for low-income households on UC/other means-tested benefits
    const age = person.age ?? 0
    if (age >= SPA)
      return { id: 'warm_home_discount', eligible: true, confidence: 'possible' }
    const lowIncome =
      person.income_band === 'under_7400' ||
      person.income_band === 'under_12570' ||
      person.income_band === 'under_16000'
    if (lowIncome)
      return { id: 'warm_home_discount', eligible: true, confidence: 'possible' }
    return { id: 'warm_home_discount', eligible: false, confidence: 'worth_checking' }
  },

  free_school_meals: (person) => {
    const hasSchoolAgeChild = person.children.some((c) => c.age >= 4 && c.age <= 16)
    if (!hasSchoolAgeChild) return { id: 'free_school_meals', eligible: false, confidence: 'likely' }
    if (
      person.income_band === 'under_7400' ||
      person.income_band === 'under_12570'
    ) {
      return { id: 'free_school_meals', eligible: true, confidence: 'likely' }
    }
    return { id: 'free_school_meals', eligible: true, confidence: 'possible' }
  },

  tax_free_childcare: (person) => {
    const hasYoungChild = person.children.some((c) => c.age < 12)
    const expecting = person.is_pregnant || person.expecting_first_child
    if (!hasYoungChild && !expecting)
      return { id: 'tax_free_childcare', eligible: false, confidence: 'likely' }
    if (
      person.employment_status === 'employed' ||
      person.employment_status === 'self_employed'
    ) {
      return { id: 'tax_free_childcare', eligible: true, confidence: 'possible' }
    }
    return { id: 'tax_free_childcare', eligible: false, confidence: 'likely' }
  },

  pip: (person) => {
    const age = person.age ?? 30
    if (age < 16 || age >= SPA) return { id: 'pip', eligible: false, confidence: 'likely' }
    if (person.has_disability_or_health_condition)
      return { id: 'pip', eligible: true, confidence: 'possible' }
    return { id: 'pip', eligible: false, confidence: 'likely' }
  },

  dla_child: (person) => {
    const hasChildWithNeeds = person.children.some((c) => c.has_additional_needs && c.age < 16)
    if (hasChildWithNeeds) return { id: 'dla_child', eligible: true, confidence: 'possible' }
    return { id: 'dla_child', eligible: false, confidence: 'likely' }
  },

  ehcp_assessment: (person) => {
    const hasChildWithNeeds = person.children.some((c) => c.has_additional_needs)
    if (hasChildWithNeeds) return { id: 'ehcp_assessment', eligible: true, confidence: 'likely' }
    return { id: 'ehcp_assessment', eligible: false, confidence: 'likely' }
  },

  marriage_allowance: (person) => {
    if (
      person.relationship_status !== 'couple_married' &&
      person.relationship_status !== 'couple_civil_partner'
    ) {
      return { id: 'marriage_allowance', eligible: false, confidence: 'likely' }
    }
    return { id: 'marriage_allowance', eligible: true, confidence: 'possible' }
  },

  healthy_start: (person) => {
    if (person.is_pregnant || person.children.some((c) => c.age < 4)) {
      if (
        person.income_band === 'under_7400' ||
        person.income_band === 'under_12570' ||
        person.income_band === 'under_16000'
      ) {
        return { id: 'healthy_start', eligible: true, confidence: 'likely' }
      }
      return { id: 'healthy_start', eligible: true, confidence: 'possible' }
    }
    return { id: 'healthy_start', eligible: false, confidence: 'likely' }
  },

  maternity_allowance: (person) => {
    if (!person.is_pregnant && !person.expecting_first_child)
      return { id: 'maternity_allowance', eligible: false, confidence: 'likely' }
    // Employed women typically get SMP from employer, but MA is fallback
    if (person.employment_status === 'employed')
      return { id: 'maternity_allowance', eligible: true, confidence: 'worth_checking' }
    return { id: 'maternity_allowance', eligible: true, confidence: 'possible' }
  },

  social_tariff_broadband: (person) => {
    // Eligible if on UC, PC, ESA, JSA
    const lowIncome =
      person.income_band === 'under_7400' ||
      person.income_band === 'under_12570' ||
      person.income_band === 'under_16000' ||
      person.income_band === 'under_25000'
    if (lowIncome)
      return { id: 'social_tariff_broadband', eligible: true, confidence: 'possible' }
    return { id: 'social_tariff_broadband', eligible: false, confidence: 'worth_checking' }
  },

  council_tax_disability_reduction: (person) => {
    if (person.has_disability_or_health_condition || person.children.some((c) => c.has_additional_needs))
      return { id: 'council_tax_disability_reduction', eligible: true, confidence: 'possible' }
    return { id: 'council_tax_disability_reduction', eligible: false, confidence: 'likely' }
  },

  blue_badge: (person) => {
    if (
      person.disability_benefit_received === 'dla_higher_mobility' ||
      person.disability_benefit_received === 'pip_mobility_enhanced'
    ) {
      return { id: 'blue_badge', eligible: true, confidence: 'likely' }
    }
    if (person.mobility_difficulty)
      return { id: 'blue_badge', eligible: true, confidence: 'possible' }
    return { id: 'blue_badge', eligible: false, confidence: 'likely' }
  },

  bereavement_support_payment: (person) => {
    if (person.is_bereaved && person.deceased_relationship === 'partner')
      return { id: 'bereavement_support_payment', eligible: true, confidence: 'possible' }
    if (person.relationship_status === 'widowed')
      return { id: 'bereavement_support_payment', eligible: true, confidence: 'possible' }
    return { id: 'bereavement_support_payment', eligible: false, confidence: 'likely' }
  },

  delay_repay: () => {
    // Consumer right — not relevant in benefits screening context
    return { id: 'delay_repay', eligible: false, confidence: 'likely' }
  },

  flight_compensation_uk261: () => {
    // Consumer right — not relevant in benefits screening context
    return { id: 'flight_compensation_uk261', eligible: false, confidence: 'likely' }
  },

  section_75_claim: () => {
    // Consumer right — not relevant in benefits screening context
    return { id: 'section_75_claim', eligible: false, confidence: 'likely' }
  },

  ni_voluntary_contributions: (person) => {
    const age = person.age ?? 30
    if (age >= 50 && age < SPA)
      return { id: 'ni_voluntary_contributions', eligible: true, confidence: 'worth_checking' }
    return { id: 'ni_voluntary_contributions', eligible: false, confidence: 'likely' }
  },
}

function isCoupleish(person: PersonData): boolean {
  return (
    person.relationship_status === 'couple_married' ||
    person.relationship_status === 'couple_civil_partner' ||
    person.relationship_status === 'couple_cohabiting'
  )
}

