import { useState, useCallback } from 'react'
import type { PersonData } from '../types/person.ts'
import type { PolicyEngineCalculatedBenefits } from '../types/policyengine.ts'
import { calculateBenefits } from '../services/policyengine.ts'

export function usePolicyEngine() {
  const [results, setResults] = useState<PolicyEngineCalculatedBenefits | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(async (person: PersonData) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await calculateBenefits(person)
      setResults(data)
      return data
    } catch {
      setError('Failed to calculate benefits')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { results, isLoading, error, calculate }
}
