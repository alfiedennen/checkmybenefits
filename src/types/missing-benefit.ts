// MissingBenefit MCP server types
// MCP endpoint: https://missingbenefit.com/mcp
// Auth: Bearer token in Authorization header

export interface MBDateOfBirth {
  day: string
  month: string
  year: string
}

export type MBRelationshipStatus = 'single' | 'couple'
export type MBHousingStatus = 'renting-social' | 'renting-private' | 'homeowner-mortgage' | 'homeowner-outright' | 'living-with-others' | 'temporary' | 'homeless'
export type MBEmploymentStatus = 'employed-full-time' | 'employed-part-time' | 'self-employed' | 'unemployed' | 'unable-to-work' | 'retired' | 'student' | 'carer-full-time'
export type MBSavingsBand = 'under-6000' | '6000-16000' | 'over-16000'
export type MBDisabilityBenefit = 'pip' | 'dla' | 'attendance-allowance' | 'none' | 'applied'
export type MBCaringHours = 'under-35' | '35-or-more'

export interface MBAnswers {
  dateOfBirth?: MBDateOfBirth
  postcode?: string
  immigrationStatus?: string
  relationshipStatus?: MBRelationshipStatus
  housingStatus?: MBHousingStatus
  employmentStatus?: MBEmploymentStatus
  monthlyEarnings?: number
  savingsAmount?: MBSavingsBand
  hasChildren?: 'yes' | 'no'
  numberOfChildren?: number
  hasHealthCondition?: 'yes' | 'no'
  receivingDisabilityBenefit?: MBDisabilityBenefit
  isCarer?: 'yes' | 'no'
  caringHoursPerWeek?: MBCaringHours
  councilTaxBand?: string
  [key: string]: string | number | boolean | MBDateOfBirth | undefined | null
}

export interface MBBreakdownLine {
  label: string
  amount: number
  isHeading?: boolean
}

export interface MBBenefitResult {
  id: string
  name: string
  eligible: boolean
  monthlyAmount: number
  annualAmount: number
  description: string
  breakdown?: MBBreakdownLine[]
  applyUrl?: string
  councilName?: string
  notes?: string[]
  confidenceScore?: number
  confidenceLabel?: string
}

export interface MBDataQuality {
  status: 'complete' | 'partial'
  note?: string
  missingFields?: Array<{
    id: string
    question: string
    priority: string
  }>
}

export interface MBCalculateResponse {
  totalMonthly: number
  totalAnnual: number
  benefits: MBBenefitResult[]
  incomeSummary?: {
    lines: unknown[]
    totalMonthlyIncome: number
    isCouple: boolean
  }
  calculatedAt: string
  disclaimer: string
  _dataQuality?: MBDataQuality
}
