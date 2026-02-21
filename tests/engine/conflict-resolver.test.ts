import { describe, it, expect } from 'vitest'
import { resolveConflicts } from '../../src/engine/conflict-resolver.ts'
import type { ConflictEdge } from '../../src/types/entitlements.ts'
import type { PersonData } from '../../src/types/person.ts'
import { createEmptyPerson } from '../../src/types/person.ts'

describe('conflict-resolver', () => {
  it('resolves TFC vs UC childcare for lower income', () => {
    const eligible = new Set(['tax_free_childcare', 'universal_credit'])
    const edges: ConflictEdge[] = [
      {
        between: ['tax_free_childcare', 'universal_credit'],
        type: 'mutual_exclusion',
        resolution: 'Calculate both',
      },
    ]
    const person: PersonData = {
      ...createEmptyPerson(),
      income_band: 'under_16000',
    }

    const result = resolveConflicts(eligible, edges, person)
    expect(result).toHaveLength(1)
    expect(result[0].recommendation).toContain('UC Childcare Element')
  })

  it('resolves TFC vs UC childcare for higher income', () => {
    const eligible = new Set(['tax_free_childcare', 'universal_credit'])
    const edges: ConflictEdge[] = [
      {
        between: ['tax_free_childcare', 'universal_credit'],
        type: 'mutual_exclusion',
        resolution: 'Calculate both',
      },
    ]
    const person: PersonData = {
      ...createEmptyPerson(),
      income_band: 'under_50270',
    }

    const result = resolveConflicts(eligible, edges, person)
    expect(result).toHaveLength(1)
    expect(result[0].recommendation).toContain('Tax-Free Childcare')
  })

  it('resolves PC vs UC by age', () => {
    const eligible = new Set(['pension_credit', 'universal_credit'])
    const edges: ConflictEdge[] = [
      {
        between: ['pension_credit', 'universal_credit'],
        type: 'mutual_exclusion',
        resolution: 'Age-dependent',
      },
    ]

    const personOver = { ...createEmptyPerson(), age: 70 }
    const resultOver = resolveConflicts(eligible, edges, personOver)
    expect(resultOver[0].recommendation).toContain('Pension Credit')

    const personUnder = { ...createEmptyPerson(), age: 40 }
    const resultUnder = resolveConflicts(eligible, edges, personUnder)
    expect(resultUnder[0].recommendation).toContain('Universal Credit')
  })

  it('skips conflicts where only one option is eligible', () => {
    const eligible = new Set(['universal_credit'])
    const edges: ConflictEdge[] = [
      {
        between: ['tax_free_childcare', 'universal_credit'],
        type: 'mutual_exclusion',
        resolution: 'Calculate both',
      },
    ]

    const result = resolveConflicts(eligible, edges, createEmptyPerson())
    expect(result).toHaveLength(0)
  })
})
