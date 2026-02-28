import { describe, it, expect } from 'vitest'
import {
  mapPersonToAnswers,
  incomeBandToMonthly,
  mapRelationshipStatus,
  mapHousingTenure,
  mapEmploymentStatus,
  mapSavingsBand,
  mapDisabilityBenefit,
  mapCaringHours,
  extractCTR,
} from '../../src/services/missing-benefit.ts'
import { createEmptyPerson } from '../../src/types/person.ts'
import type { PersonData } from '../../src/types/person.ts'
import type { MBCalculateResponse, MBBenefitResult } from '../../src/types/missing-benefit.ts'

// ── Helpers ─────────────────────────────────────────

function personWith(overrides: Partial<PersonData>): PersonData {
  return { ...createEmptyPerson(), ...overrides }
}

function makeMBResponse(benefits: MBBenefitResult[]): MBCalculateResponse {
  return {
    totalMonthly: 0,
    totalAnnual: 0,
    benefits,
    calculatedAt: '2026-01-01T00:00:00Z',
    disclaimer: 'Test',
  }
}

// ── MB-01: PersonData → MB answers mapping ──────────

describe('MB-01: PersonData → MB answers mapping', () => {
  it('maps a complete PersonData to valid MB answers', () => {
    const person = personWith({
      age: 45,
      postcode: 'E17 4SA',
      relationship_status: 'single',
      housing_tenure: 'rent_social',
      employment_status: 'unemployed',
      income_band: 'under_7400',
      children: [],
      has_disability_or_health_condition: false,
      is_carer: false,
    })

    const answers = mapPersonToAnswers(person)

    expect(answers.dateOfBirth).toBeDefined()
    expect(answers.dateOfBirth!.year).toBe(String(new Date().getFullYear() - 45))
    expect(answers.postcode).toBe('E17 4SA')
    expect(answers.immigrationStatus).toBe('uk-irish')
    expect(answers.relationshipStatus).toBe('single')
    expect(answers.housingStatus).toBe('renting-social')
    expect(answers.employmentStatus).toBe('unemployed')
    expect(answers.monthlyEarnings).toBe(308)
    expect(answers.hasChildren).toBe('no')
    expect(answers.hasHealthCondition).toBe('no')
    expect(answers.isCarer).toBe('no')
  })

  it('always sets immigrationStatus to uk-irish', () => {
    const answers = mapPersonToAnswers(createEmptyPerson())
    expect(answers.immigrationStatus).toBe('uk-irish')
  })

  it('estimates dateOfBirth from age as June 1st of birth year', () => {
    const answers = mapPersonToAnswers(personWith({ age: 30 }))
    expect(answers.dateOfBirth).toEqual({
      day: '1',
      month: '6',
      year: String(new Date().getFullYear() - 30),
    })
  })

  it('omits dateOfBirth when age is undefined', () => {
    const answers = mapPersonToAnswers(createEmptyPerson())
    expect(answers.dateOfBirth).toBeUndefined()
  })
})

// ── MB-02: Income band midpoint mapping ─────────────

describe('MB-02: Income band midpoint mapping', () => {
  it('maps each income band to correct monthly figure', () => {
    expect(incomeBandToMonthly('under_7400')).toBe(308)
    expect(incomeBandToMonthly('under_12570')).toBe(833)
    expect(incomeBandToMonthly('under_16000')).toBe(1190)
    expect(incomeBandToMonthly('under_25000')).toBe(1708)
    expect(incomeBandToMonthly('under_50270')).toBe(3136)
    expect(incomeBandToMonthly('under_60000')).toBe(5000)
    expect(incomeBandToMonthly('under_100000')).toBe(6667)
    expect(incomeBandToMonthly('under_125140')).toBe(9375)
    expect(incomeBandToMonthly('over_125140')).toBe(12500)
  })

  it('returns undefined for prefer_not_to_say', () => {
    expect(incomeBandToMonthly('prefer_not_to_say')).toBeUndefined()
  })

  it('returns undefined for undefined band', () => {
    expect(incomeBandToMonthly(undefined)).toBeUndefined()
  })
})

// ── MB-03: Missing fields handled ───────────────────

describe('MB-03: Missing fields handled', () => {
  it('maps an empty PersonData without errors', () => {
    const answers = mapPersonToAnswers(createEmptyPerson())
    expect(answers).toBeDefined()
    expect(answers.immigrationStatus).toBe('uk-irish')
    expect(answers.hasChildren).toBe('no')
  })

  it('omits undefined optional fields from answers', () => {
    const answers = mapPersonToAnswers(createEmptyPerson())
    expect(answers.relationshipStatus).toBeUndefined()
    expect(answers.housingStatus).toBeUndefined()
    expect(answers.employmentStatus).toBeUndefined()
    expect(answers.monthlyEarnings).toBeUndefined()
    expect(answers.savingsAmount).toBeUndefined()
    expect(answers.councilTaxBand).toBeUndefined()
  })
})

// ── MB-04: Couple mapping ───────────────────────────

describe('MB-04: Couple mapping', () => {
  it('maps couple_married to couple', () => {
    expect(mapRelationshipStatus('couple_married')).toBe('couple')
  })

  it('maps couple_civil_partner to couple', () => {
    expect(mapRelationshipStatus('couple_civil_partner')).toBe('couple')
  })

  it('maps couple_cohabiting to couple', () => {
    expect(mapRelationshipStatus('couple_cohabiting')).toBe('couple')
  })

  it('maps separated to single', () => {
    expect(mapRelationshipStatus('separated')).toBe('single')
  })

  it('maps widowed to single', () => {
    expect(mapRelationshipStatus('widowed')).toBe('single')
  })

  it('returns undefined for undefined', () => {
    expect(mapRelationshipStatus(undefined)).toBeUndefined()
  })
})

// ── MB-05: Children mapping ─────────────────────────

describe('MB-05: Children mapping', () => {
  it('maps children present to hasChildren=yes + count', () => {
    const person = personWith({
      children: [
        { age: 5, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 8, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
    })
    const answers = mapPersonToAnswers(person)
    expect(answers.hasChildren).toBe('yes')
    expect(answers.numberOfChildren).toBe(2)
  })

  it('maps no children to hasChildren=no', () => {
    const answers = mapPersonToAnswers(createEmptyPerson())
    expect(answers.hasChildren).toBe('no')
    expect(answers.numberOfChildren).toBeUndefined()
  })
})

// ── MB-06: Housing tenure mapping ───────────────────

describe('MB-06: Housing tenure mapping', () => {
  it('maps all 6 tenure types correctly', () => {
    expect(mapHousingTenure('rent_social')).toBe('renting-social')
    expect(mapHousingTenure('rent_private')).toBe('renting-private')
    expect(mapHousingTenure('mortgage')).toBe('homeowner-mortgage')
    expect(mapHousingTenure('own_outright')).toBe('homeowner-outright')
    expect(mapHousingTenure('living_with_family')).toBe('living-with-others')
    expect(mapHousingTenure('homeless')).toBe('homeless')
  })

  it('returns undefined for undefined tenure', () => {
    expect(mapHousingTenure(undefined)).toBeUndefined()
  })
})

// ── MB-07: Employment status mapping ────────────────

describe('MB-07: Employment status mapping', () => {
  it('maps all status values correctly', () => {
    expect(mapEmploymentStatus('employed')).toBe('employed-full-time')
    expect(mapEmploymentStatus('self_employed')).toBe('self-employed')
    expect(mapEmploymentStatus('unemployed')).toBe('unemployed')
    expect(mapEmploymentStatus('retired')).toBe('retired')
    expect(mapEmploymentStatus('student')).toBe('student')
    expect(mapEmploymentStatus('carer_fulltime')).toBe('carer-full-time')
    expect(mapEmploymentStatus('sick_disabled')).toBe('unable-to-work')
  })

  it('returns undefined for undefined status', () => {
    expect(mapEmploymentStatus(undefined)).toBeUndefined()
  })
})

// ── MB-08: Response parsing (extractCTR) ────────────

describe('MB-08: Response parsing', () => {
  it('extracts CTR benefit from response', () => {
    const response = makeMBResponse([
      { id: 'universal-credit', name: 'UC', eligible: true, monthlyAmount: 400, annualAmount: 4800, description: '' },
      {
        id: 'council-tax-reduction',
        name: 'Council Tax Reduction',
        eligible: true,
        monthlyAmount: 128,
        annualAmount: 1543,
        description: '',
        councilName: 'Waltham Forest',
        confidenceScore: 95,
        confidenceLabel: 'High',
      },
    ])

    const ctr = extractCTR(response)
    expect(ctr).not.toBeNull()
    expect(ctr!.councilName).toBe('Waltham Forest')
    expect(ctr!.annualAmount).toBe(1543)
    expect(ctr!.confidenceScore).toBe(95)
  })

  it('returns null when CTR not in response', () => {
    const response = makeMBResponse([
      { id: 'universal-credit', name: 'UC', eligible: true, monthlyAmount: 400, annualAmount: 4800, description: '' },
    ])
    expect(extractCTR(response)).toBeNull()
  })

  it('returns CTR even when not eligible', () => {
    const response = makeMBResponse([
      {
        id: 'council-tax-reduction',
        name: 'CTR',
        eligible: false,
        monthlyAmount: 0,
        annualAmount: 0,
        description: '',
      },
    ])
    const ctr = extractCTR(response)
    expect(ctr).not.toBeNull()
    expect(ctr!.eligible).toBe(false)
  })
})

// ── MB-09: Error/timeout handling ───────────────────

describe('MB-09: Error/timeout handling', () => {
  // calculateBenefits returns null on any error — tested via the service's try/catch
  // These are structural tests verifying the mapping doesn't throw on edge cases

  it('handles PersonData with all undefined optional fields', () => {
    expect(() => mapPersonToAnswers(createEmptyPerson())).not.toThrow()
  })

  it('handles PersonData with unknown disability benefit level', () => {
    const person = personWith({ disability_benefit_received: 'none' })
    const answers = mapPersonToAnswers(person)
    expect(answers.receivingDisabilityBenefit).toBe('none')
  })
})

// ── MB-10: Confidence label / savings / caring ──────

describe('MB-10: Ancillary mappings', () => {
  it('maps savings bands correctly', () => {
    expect(mapSavingsBand(0)).toBe('under-6000')
    expect(mapSavingsBand(5999)).toBe('under-6000')
    expect(mapSavingsBand(6000)).toBe('6000-16000')
    expect(mapSavingsBand(16000)).toBe('6000-16000')
    expect(mapSavingsBand(16001)).toBe('over-16000')
  })

  it('returns undefined for undefined capital', () => {
    expect(mapSavingsBand(undefined)).toBeUndefined()
  })

  it('maps disability benefit types correctly', () => {
    expect(mapDisabilityBenefit('pip_daily_living_standard')).toBe('pip')
    expect(mapDisabilityBenefit('pip_mobility_enhanced')).toBe('pip')
    expect(mapDisabilityBenefit('dla_higher_care')).toBe('dla')
    expect(mapDisabilityBenefit('attendance_allowance_lower')).toBe('attendance-allowance')
    expect(mapDisabilityBenefit('none')).toBe('none')
    expect(mapDisabilityBenefit(undefined)).toBe('none')
  })

  it('maps caring hours correctly', () => {
    expect(mapCaringHours(35)).toBe('35-or-more')
    expect(mapCaringHours(40)).toBe('35-or-more')
    expect(mapCaringHours(34)).toBe('under-35')
    expect(mapCaringHours(0)).toBe('under-35')
    expect(mapCaringHours(undefined)).toBeUndefined()
  })

  it('passes through council tax band if present', () => {
    const person = personWith({ council_tax_band: 'B' })
    const answers = mapPersonToAnswers(person)
    expect(answers.councilTaxBand).toBe('B')
  })
})
