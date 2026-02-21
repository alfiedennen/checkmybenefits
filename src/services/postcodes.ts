export interface PostcodeLookupResult {
  postcode: string
  admin_district: string
  region: string
  country: string
}

export async function lookupPostcode(postcode: string): Promise<PostcodeLookupResult | null> {
  const cleaned = postcode.trim().replace(/\s+/g, '')
  if (cleaned.length < 5 || cleaned.length > 7) return null

  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`)
    if (!response.ok) return null

    const data = await response.json()
    if (data.status !== 200 || !data.result) return null

    return {
      postcode: data.result.postcode,
      admin_district: data.result.admin_district ?? '',
      region: data.result.region ?? '',
      country: data.result.country ?? 'England',
    }
  } catch {
    return null
  }
}

export function countryToNation(country: string): 'england' | 'scotland' | 'wales' | 'northern_ireland' {
  const lower = country.toLowerCase()
  if (lower.includes('scotland')) return 'scotland'
  if (lower.includes('wales')) return 'wales'
  if (lower.includes('northern ireland')) return 'northern_ireland'
  return 'england'
}
