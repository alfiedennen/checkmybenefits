import type { PersonData } from '../types/person.ts'
import type { PolicyEngineCalculatedBenefits, UCComponents } from '../types/policyengine.ts'

const PE_API_URL = 'https://household.api.policyengine.org/uk/calculate'
const PE_TIMEOUT_MS = 4000

export function mapPersonToHousehold(person: PersonData) {
  const age = person.age ?? 35
  const income = person.gross_annual_income ?? 0
  const isCouple = person.relationship_status?.startsWith('couple') ?? false
  const isSelfEmployed = person.employment_status === 'self_employed'
  const isUnemployed = person.employment_status === 'unemployed'

  const you: Record<string, unknown> = {
    age: { '2025': age },
  }

  // Income: route to correct PE variable based on employment status
  if (isSelfEmployed) {
    you['self_employment_income'] = { '2025': income }
  } else {
    you['employment_income'] = { '2025': income }
  }

  // Employment hours (PE needs this for UC work allowance)
  if (isUnemployed) {
    you['hours_worked'] = { '2025': 0 }
  } else if (person.employment_status === 'employed' || isSelfEmployed) {
    you['hours_worked'] = { '2025': 35 }
  }

  // Disability and carer flags
  if (person.has_disability_or_health_condition) {
    you['is_disabled'] = { '2025': true }
  }
  if (person.is_carer && (person.carer_hours_per_week ?? 0) >= 35) {
    you['is_carer_for_benefits'] = { '2025': true }
  }
  if (person.is_pregnant) {
    you['is_pregnant'] = { '2025': true }
  }

  const members = ['you']
  const adults = ['you']
  const children: string[] = []

  if (isCouple) {
    members.push('partner')
    adults.push('partner')
    you['is_married'] = { '2025': true }
  }

  const people: Record<string, Record<string, unknown>> = { you }

  if (isCouple) {
    const partnerAge = person.partner_age ?? age
    const partnerIncome = person.partner_gross_annual_income ?? 0
    people['partner'] = {
      age: { '2025': partnerAge },
      employment_income: { '2025': partnerIncome },
    }
  }

  person.children.forEach((child, i) => {
    const childId = `child_${i}`
    const childPerson: Record<string, unknown> = {
      age: { '2025': child.age },
    }
    if (child.has_additional_needs) {
      childPerson['is_disabled'] = { '2025': true }
    }
    people[childId] = childPerson
    members.push(childId)
    children.push(childId)
  })

  // Household entity
  const household: Record<string, unknown> = {
    members,
  }

  if (person.housing_tenure === 'rent_private' || person.housing_tenure === 'rent_social') {
    household['rent'] = { '2025': (person.monthly_housing_cost ?? 0) * 12 }
  } else if (person.housing_tenure === 'mortgage') {
    household['mortgage'] = { '2025': (person.monthly_housing_cost ?? 0) * 12 }
  }

  if (person.council_tax_band) {
    household['council_tax_band'] = { '2025': person.council_tax_band }
  }

  // Benunit entity
  const benunit: Record<string, unknown> = {
    members,
    adults,
    children,
    would_claim_UC: { '2025': true },
    would_claim_PC: { '2025': true },
  }

  if (person.household_capital !== undefined) {
    benunit['household_savings'] = { '2025': person.household_capital }
  }

  if (person.weekly_childcare_costs !== undefined) {
    benunit['childcare_expenses'] = { '2025': person.weekly_childcare_costs * 52 }
  }

  return {
    people,
    households: { household },
    benunits: { benunit },
    families: {
      family: { members, adults, children },
    },
  }
}

export async function calculateBenefits(person: PersonData): Promise<PolicyEngineCalculatedBenefits | null> {
  try {
    const household = mapPersonToHousehold(person)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PE_TIMEOUT_MS)

    const response = await fetch(PE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ household }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const data = await response.json()
    return parseResults(data)
  } catch {
    return null
  }
}

function parseResults(data: Record<string, unknown>): PolicyEngineCalculatedBenefits {
  const result = data as { result?: Record<string, Record<string, Record<string, { '2025': number }>>> }
  const benunits = result.result?.benunits?.benunit ?? {}
  const households = result.result?.households?.household ?? {}

  const getVal = (source: Record<string, { '2025': number }>, key: string): number | undefined => {
    const entry = source[key]
    if (entry && typeof entry['2025'] === 'number' && entry['2025'] > 0) {
      return Math.round(entry['2025'])
    }
    return undefined
  }

  // UC component breakdown
  const ucComponents: UCComponents = {
    standard_allowance: getVal(benunits, 'UC_standard_allowance'),
    child_element: getVal(benunits, 'UC_child_element'),
    housing_element: getVal(benunits, 'UC_housing_costs_element'),
    carer_element: getVal(benunits, 'UC_carer_element'),
    disability_element: getVal(benunits, 'UC_LCWRA_element'),
    childcare_element: getVal(benunits, 'UC_childcare_element'),
  }

  const hasUcComponents = Object.values(ucComponents).some((v) => v !== undefined)

  return {
    universal_credit: getVal(benunits, 'universal_credit'),
    pension_credit: getVal(benunits, 'pension_credit'),
    child_benefit: getVal(benunits, 'child_benefit'),
    housing_benefit: getVal(benunits, 'housing_benefit'),
    council_tax_support: getVal(households, 'council_tax_benefit'),
    income_tax: getVal(benunits, 'income_tax'),
    national_insurance: getVal(benunits, 'national_insurance'),
    ...(hasUcComponents ? { universal_credit_components: ucComponents } : {}),
    pension_credit_guarantee: getVal(benunits, 'pension_credit_guarantee_credit'),
    pension_credit_savings: getVal(benunits, 'pension_credit_savings_credit'),
  }
}
