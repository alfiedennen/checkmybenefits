export interface PostcodeLookupResult {
  postcode: string
  admin_district: string
  region: string
  country: string
  lsoa: string
  partial: boolean
}

const OUTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?$/i

export async function lookupPostcode(postcode: string): Promise<PostcodeLookupResult | null> {
  const cleaned = postcode.trim().replace(/\s+/g, '')

  // Full postcode: 5-7 chars
  if (cleaned.length >= 5 && cleaned.length <= 7) {
    return lookupFullPostcode(cleaned)
  }

  // Outcode: 2-4 chars matching UK outcode pattern
  if (cleaned.length >= 2 && cleaned.length <= 4 && OUTCODE_PATTERN.test(cleaned)) {
    return lookupOutcode(cleaned)
  }

  return null
}

async function lookupFullPostcode(cleaned: string): Promise<PostcodeLookupResult | null> {
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
      lsoa: data.result.codes?.lsoa ?? '',
      partial: false,
    }
  } catch {
    return null
  }
}

export async function lookupOutcode(outcode: string): Promise<PostcodeLookupResult | null> {
  const cleaned = outcode.trim().replace(/\s+/g, '').toUpperCase()
  if (!OUTCODE_PATTERN.test(cleaned)) return null

  try {
    const response = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(cleaned)}`)
    if (!response.ok) return null

    const data = await response.json()
    if (data.status !== 200 || !data.result) return null

    // Outcode returns arrays for admin_district and country
    const country = Array.isArray(data.result.country)
      ? data.result.country[0] ?? 'England'
      : data.result.country ?? 'England'

    const adminDistrict = Array.isArray(data.result.admin_district)
      ? data.result.admin_district[0] ?? ''
      : data.result.admin_district ?? ''

    return {
      postcode: data.result.outcode,
      admin_district: adminDistrict,
      region: '',
      country,
      lsoa: '',
      partial: true,
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
