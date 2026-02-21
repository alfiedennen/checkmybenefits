export type Nation = 'england' | 'scotland' | 'wales' | 'northern_ireland'

export type HousingTenure =
  | 'own_outright'
  | 'mortgage'
  | 'rent_social'
  | 'rent_private'
  | 'living_with_family'
  | 'homeless'

export type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'unemployed'
  | 'retired'
  | 'student'
  | 'carer_fulltime'
  | 'sick_disabled'

export type RelationshipStatus =
  | 'single'
  | 'couple_married'
  | 'couple_civil_partner'
  | 'couple_cohabiting'
  | 'separated'
  | 'widowed'

export type DisabilityBenefitLevel =
  | 'none'
  | 'dla_lower_care'
  | 'dla_middle_care'
  | 'dla_higher_care'
  | 'dla_lower_mobility'
  | 'dla_higher_mobility'
  | 'pip_daily_living_standard'
  | 'pip_daily_living_enhanced'
  | 'pip_mobility_standard'
  | 'pip_mobility_enhanced'
  | 'attendance_allowance_lower'
  | 'attendance_allowance_higher'

export type IncomeBand =
  | 'under_7400'
  | 'under_12570'
  | 'under_16000'
  | 'under_25000'
  | 'under_50270'
  | 'under_60000'
  | 'under_100000'
  | 'under_125140'
  | 'over_125140'
  | 'prefer_not_to_say'

export interface ChildData {
  age: number
  has_additional_needs: boolean
  disability_benefit: DisabilityBenefitLevel
  in_education: boolean
}

export interface CaredForPerson {
  relationship: string
  age: number
  disability_benefit: DisabilityBenefitLevel
  needs_help_daily_living: boolean
}

export interface PersonData {
  age?: number
  date_of_birth?: string
  nation?: Nation
  postcode?: string
  local_authority?: string
  relationship_status?: RelationshipStatus
  employment_status?: EmploymentStatus
  gross_annual_income?: number
  income_band?: IncomeBand
  partner_gross_annual_income?: number
  household_capital?: number
  housing_tenure?: HousingTenure
  monthly_housing_cost?: number
  children: ChildData[]
  has_disability_or_health_condition?: boolean
  disability_benefit_received?: DisabilityBenefitLevel
  needs_help_with_daily_living?: boolean
  mobility_difficulty?: boolean
  is_carer?: boolean
  carer_hours_per_week?: number
  cared_for_person?: CaredForPerson
  is_pregnant?: boolean
  expecting_first_child?: boolean
  is_bereaved?: boolean
  deceased_relationship?: string
  recently_redundant?: boolean
  ni_contribution_years?: number
  has_medical_exemption?: boolean
  on_water_meter?: boolean
  months_on_uc?: number
}

export function createEmptyPerson(): PersonData {
  return { children: [] }
}
