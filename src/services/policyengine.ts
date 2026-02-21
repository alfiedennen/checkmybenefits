import type { PersonData } from '../types/person.ts'
import type { PolicyEngineCalculatedBenefits } from '../types/policyengine.ts'

const PE_API_URL = 'https://household.api.policyengine.org/uk/calculate'

export function mapPersonToHousehold(person: PersonData) {
  const age = person.age ?? 35
  const income = person.gross_annual_income ?? 0
  const isCouple = person.relationship_status?.startsWith('couple') ?? false

  const you: Record<string, unknown> = {
    age: { '2025': age },
    employment_income: { '2025': income },
  }

  const members = ['you']
  const adults = ['you']
  const children: string[] = []

  if (isCouple) {
    const partnerIncome = person.partner_gross_annual_income ?? 0
    members.push('partner')
    adults.push('partner')
    ;(you as Record<string, unknown>)['is_married'] = { '2025': true }
  }

  const people: Record<string, Record<string, unknown>> = { you }

  if (isCouple) {
    people['partner'] = {
      age: { '2025': age },
      employment_income: { '2025': person.partner_gross_annual_income ?? 0 },
    }
  }

  person.children.forEach((child, i) => {
    const childId = `child_${i}`
    people[childId] = {
      age: { '2025': child.age },
    }
    members.push(childId)
    children.push(childId)
  })

  const household: Record<string, unknown> = {
    members,
  }

  if (person.housing_tenure === 'rent_private' || person.housing_tenure === 'rent_social') {
    household['rent'] = { '2025': (person.monthly_housing_cost ?? 0) * 12 }
  }

  return {
    people,
    households: { household },
    benunits: {
      benunit: { members, adults, children },
    },
    families: {
      family: { members, adults, children },
    },
  }
}

export async function calculateBenefits(person: PersonData): Promise<PolicyEngineCalculatedBenefits | null> {
  try {
    const household = mapPersonToHousehold(person)

    const response = await fetch(PE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ household }),
    })

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

  return {
    universal_credit: getVal(benunits, 'universal_credit'),
    pension_credit: getVal(benunits, 'pension_credit'),
    child_benefit: getVal(benunits, 'child_benefit'),
    housing_benefit: getVal(benunits, 'housing_benefit'),
    council_tax_support: getVal(households, 'council_tax_benefit'),
    income_tax: getVal(benunits, 'income_tax'),
    national_insurance: getVal(benunits, 'national_insurance'),
  }
}
