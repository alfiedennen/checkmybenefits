import { useState, useCallback, useRef } from 'react'
import { lookupPostcode, countryToNation, type PostcodeLookupResult } from '../services/postcodes.ts'

export function usePostcode() {
  const [result, setResult] = useState<PostcodeLookupResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const lookup = useCallback((postcode: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      const data = await lookupPostcode(postcode)
      setResult(data)
      setIsLoading(false)
    }, 300)
  }, [])

  const nation = result ? countryToNation(result.country) : null

  return { result, nation, isLoading, lookup }
}
