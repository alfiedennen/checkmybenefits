import type { PersonData, IncomeBand } from '../types/person.ts'
import type {
  MBAnswers,
  MBCalculateResponse,
  MBBenefitResult,
  MBRelationshipStatus,
  MBHousingStatus,
  MBEmploymentStatus,
  MBSavingsBand,
  MBDisabilityBenefit,
  MBCaringHours,
} from '../types/missing-benefit.ts'

const MB_TIMEOUT_MS = 8000

// Income band → monthly earnings midpoint mapping
const INCOME_BAND_MONTHLY: Record<string, number> = {
  under_7400: 308,
  under_12570: 833,
  under_16000: 1190,
  under_25000: 1708,
  under_50270: 3136,
  under_60000: 5000,
  under_100000: 6667,
  under_125140: 9375,
  over_125140: 12500,
}

export function incomeBandToMonthly(band: IncomeBand | undefined): number | undefined {
  if (!band || band === 'prefer_not_to_say') return undefined
  return INCOME_BAND_MONTHLY[band]
}

export function mapRelationshipStatus(status: PersonData['relationship_status']): MBRelationshipStatus | undefined {
  if (!status) return undefined
  if (status === 'single' || status === 'separated' || status === 'widowed') return 'single'
  if (status.startsWith('couple')) return 'couple'
  return 'single'
}

export function mapHousingTenure(tenure: PersonData['housing_tenure']): MBHousingStatus | undefined {
  if (!tenure) return undefined
  const map: Record<string, MBHousingStatus> = {
    rent_social: 'renting-social',
    rent_private: 'renting-private',
    mortgage: 'homeowner-mortgage',
    own_outright: 'homeowner-outright',
    living_with_family: 'living-with-others',
    homeless: 'homeless',
  }
  return map[tenure]
}

export function mapEmploymentStatus(status: PersonData['employment_status']): MBEmploymentStatus | undefined {
  if (!status) return undefined
  const map: Record<string, MBEmploymentStatus> = {
    employed: 'employed-full-time',
    self_employed: 'self-employed',
    unemployed: 'unemployed',
    retired: 'retired',
    student: 'student',
    carer_fulltime: 'carer-full-time',
    sick_disabled: 'unable-to-work',
  }
  return map[status]
}

export function mapSavingsBand(capital: number | undefined): MBSavingsBand | undefined {
  if (capital === undefined) return undefined
  if (capital < 6000) return 'under-6000'
  if (capital <= 16000) return '6000-16000'
  return 'over-16000'
}

export function mapDisabilityBenefit(level: PersonData['disability_benefit_received']): MBDisabilityBenefit | undefined {
  if (!level || level === 'none') return 'none'
  if (level.startsWith('pip')) return 'pip'
  if (level.startsWith('dla')) return 'dla'
  if (level.startsWith('attendance_allowance')) return 'attendance-allowance'
  return 'none'
}

export function mapCaringHours(hours: number | undefined): MBCaringHours | undefined {
  if (hours === undefined) return undefined
  return hours >= 35 ? '35-or-more' : 'under-35'
}

export function mapPersonToAnswers(person: PersonData): MBAnswers {
  const answers: MBAnswers = {}

  // Date of birth from age (estimate: June 1 of birth year)
  if (person.age !== undefined) {
    const birthYear = new Date().getFullYear() - person.age
    answers.dateOfBirth = { day: '1', month: '6', year: String(birthYear) }
  }

  if (person.postcode) answers.postcode = person.postcode

  // We don't collect immigration status — default to UK/Irish (our scope)
  answers.immigrationStatus = 'uk-irish'

  const relationship = mapRelationshipStatus(person.relationship_status)
  if (relationship) answers.relationshipStatus = relationship

  const housing = mapHousingTenure(person.housing_tenure)
  if (housing) answers.housingStatus = housing

  const employment = mapEmploymentStatus(person.employment_status)
  if (employment) answers.employmentStatus = employment

  const monthlyEarnings = incomeBandToMonthly(person.income_band)
  if (monthlyEarnings !== undefined) answers.monthlyEarnings = monthlyEarnings

  const savings = mapSavingsBand(person.household_capital)
  if (savings) answers.savingsAmount = savings

  // Children
  if (person.children.length > 0) {
    answers.hasChildren = 'yes'
    answers.numberOfChildren = person.children.length
  } else {
    answers.hasChildren = 'no'
  }

  // Health
  if (person.has_disability_or_health_condition !== undefined) {
    answers.hasHealthCondition = person.has_disability_or_health_condition ? 'yes' : 'no'
  }

  const disability = mapDisabilityBenefit(person.disability_benefit_received)
  if (disability) answers.receivingDisabilityBenefit = disability

  // Caring
  if (person.is_carer !== undefined) {
    answers.isCarer = person.is_carer ? 'yes' : 'no'
  }

  const caringHours = mapCaringHours(person.carer_hours_per_week)
  if (caringHours) answers.caringHoursPerWeek = caringHours

  // Council tax band (if we happen to have it)
  if (person.council_tax_band) answers.councilTaxBand = person.council_tax_band

  return answers
}

export function extractCTR(response: MBCalculateResponse): MBBenefitResult | null {
  return response.benefits.find((b) => b.id === 'council-tax-reduction') ?? null
}

export async function calculateBenefits(
  apiUrl: string,
  answers: MBAnswers,
): Promise<MBCalculateResponse | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), MB_TIMEOUT_MS)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, skipDataCheck: true }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const data = await response.json()
    return data as MBCalculateResponse
  } catch {
    return null
  }
}
