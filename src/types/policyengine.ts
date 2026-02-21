export interface PolicyEngineHousehold {
  people: Record<string, PolicyEnginePerson>
  households: Record<string, { members: string[] }>
  benunits: Record<string, { members: string[]; adults: string[]; children: string[] }>
  families: Record<string, { members: string[]; adults: string[]; children: string[] }>
}

export interface PolicyEnginePerson {
  age: { '2025': number }
  employment_income?: { '2025': number }
  self_employment_income?: { '2025': number }
  state_pension?: { '2025': number }
  [key: string]: unknown
}

export interface PolicyEngineRequest {
  household: PolicyEngineHousehold
  output_metrics?: string[]
}

export interface PolicyEngineResponse {
  result: {
    households: Record<string, Record<string, { '2025': number }>>
    people: Record<string, Record<string, { '2025': number }>>
    benunits: Record<string, Record<string, { '2025': number }>>
    families: Record<string, Record<string, { '2025': number }>>
  }
}

export interface UCComponents {
  standard_allowance?: number
  child_element?: number
  housing_element?: number
  carer_element?: number
  disability_element?: number
  childcare_element?: number
}

export interface PolicyEngineCalculatedBenefits {
  universal_credit?: number
  pension_credit?: number
  child_benefit?: number
  housing_benefit?: number
  council_tax_support?: number
  income_tax?: number
  national_insurance?: number
  universal_credit_components?: UCComponents
  pension_credit_guarantee?: number
  pension_credit_savings?: number
  [key: string]: number | UCComponents | undefined
}
