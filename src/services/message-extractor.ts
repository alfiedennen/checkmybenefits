import type { PersonData, ChildData, CaredForPerson, IncomeBand } from '../types/person.ts'

/**
 * Deterministic code-based extraction from user message text.
 * Catches fields that the LLM may skip. Used as a fallback layer —
 * model-extracted values always take precedence.
 */
export function extractFromMessage(text: string): Partial<PersonData> {
  const result: Partial<PersonData> = {}

  // Order matters: some extractions inform others
  const postcode = extractPostcode(text)
  if (postcode) result.postcode = postcode

  const age = extractAge(text)
  if (age !== undefined) result.age = age

  const income = extractIncome(text)
  if (income !== undefined) {
    result.gross_annual_income = income
    result.income_band = deriveBand(income)
  }

  const housingCost = extractHousingCost(text)
  if (housingCost !== undefined) result.monthly_housing_cost = housingCost

  const savings = extractSavings(text)
  if (savings !== undefined) result.household_capital = savings

  const relationship = extractRelationship(text)
  if (relationship) result.relationship_status = relationship

  const housing = extractHousingTenure(text)
  if (housing) result.housing_tenure = housing

  const employment = extractEmployment(text)
  if (employment) {
    result.employment_status = employment.status
    if (employment.recentlyRedundant) result.recently_redundant = true
  }

  const pregnancy = extractPregnancy(text)
  if (pregnancy) {
    result.is_pregnant = pregnancy.isPregnant || undefined
    result.expecting_first_child = pregnancy.firstChild || undefined
  }

  const children = extractChildren(text)
  if (children.length > 0) result.children = children

  const caredFor = extractCaredForPerson(text)
  if (caredFor) result.cared_for_person = caredFor

  const carer = extractCarer(text)
  if (carer) {
    result.is_carer = true
    if (carer.hoursPerWeek !== undefined) result.carer_hours_per_week = carer.hoursPerWeek
  }

  if (extractDisabilityOrHealthCondition(text)) {
    result.has_disability_or_health_condition = true
  }

  if (extractMobilityDifficulty(text)) {
    result.mobility_difficulty = true
  }

  if (extractNeedsHelpDailyLiving(text)) {
    result.needs_help_with_daily_living = true
  }

  const bereavement = extractBereavement(text)
  if (bereavement) {
    result.is_bereaved = true
    if (bereavement.relationship) result.deceased_relationship = bereavement.relationship
    if (bereavement.widowed && !result.relationship_status) {
      result.relationship_status = 'widowed'
    }
  }

  const disabilityBenefit = extractDisabilityBenefitReceived(text)
  if (disabilityBenefit) {
    result.disability_benefit_received = disabilityBenefit
  }

  if (extractMedicalExemption(text)) {
    result.has_medical_exemption = true
  }

  if (extractWaterMeter(text)) {
    result.on_water_meter = true
  }

  const ucMonths = extractMonthsOnUC(text)
  if (ucMonths !== undefined) {
    result.months_on_uc = ucMonths
  }

  return result
}

/**
 * Merge model-extracted data with code-extracted data.
 * Model values always win. Code only fills gaps.
 */
export function mergeExtraction(
  modelData: Partial<PersonData> | undefined,
  codeData: Partial<PersonData>,
): Partial<PersonData> {
  if (!modelData || Object.keys(modelData).length === 0) {
    return codeData
  }
  if (Object.keys(codeData).length === 0) {
    return modelData
  }

  const merged: Partial<PersonData> = { ...codeData }

  // Model values override code values
  for (const [key, value] of Object.entries(modelData)) {
    if (value !== undefined && value !== null) {
      // Special handling for children: only override if model has a non-empty array
      if (key === 'children') {
        const modelChildren = value as ChildData[]
        if (modelChildren.length > 0) {
          (merged as Record<string, unknown>)[key] = value
        }
        continue
      }
      (merged as Record<string, unknown>)[key] = value
    }
  }

  // If we have gross_annual_income from either source, ensure income_band is derived
  const finalIncome = merged.gross_annual_income
  if (finalIncome !== undefined && !merged.income_band) {
    merged.income_band = deriveBand(finalIncome)
  }

  return merged
}

// ── Individual extractors ─────────────────────────────

function extractPostcode(text: string): string | undefined {
  const match = text.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i)
  return match ? match[1].toUpperCase().replace(/\s+/, ' ') : undefined
}

function extractAge(text: string): number | undefined {
  // "I'm 34" / "I am 42" / "aged 34"
  const patterns = [
    /(?:I'm|I am|i'm|i am)\s+(\d{1,3})\b/,
    /\b(\d{1,3})\s+years?\s+old\b/i,
    /\baged?\s+(\d{1,3})\b/i,
  ]
  for (const p of patterns) {
    const match = text.match(p)
    if (match) {
      const age = parseInt(match[1], 10)
      // Sanity check: must be plausible person age, not a child's age in context
      if (age >= 16 && age <= 110) return age
    }
  }
  return undefined
}

function extractIncome(text: string): number | undefined {
  // "earning about £12,000" / "earns £12k" / "income of £25,000"
  const annualPatterns = [
    /(?:earn|earning|earns|income|salary)\s*(?:of|is|about|around|roughly)?\s*£([\d,]+)/i,
    /£([\d,]+)\s*(?:a\s*year|per\s*annum|annually|pa)\b/i,
  ]
  for (const p of annualPatterns) {
    const match = text.match(p)
    if (match) {
      const amount = parseAmount(match[1])
      if (amount && amount >= 100) return amount // Avoid matching tiny numbers
    }
  }

  // "about 12 grand" / "twelve grand" / "30k" / "£45k"
  const informalPatterns = [
    /(?:about|around|roughly|earning|earns?)\s*(?:£)?([\d,]+)\s*(?:grand|k)\b/i,
    /£([\d,]+)\s*k\b/i,
  ]
  for (const p of informalPatterns) {
    const match = text.match(p)
    if (match) {
      const amount = parseAmount(match[1])
      if (amount) return amount * 1000
    }
  }

  // "twelve grand" / "twelve thousand"
  const wordPatterns: Array<[RegExp, number]> = [
    [/\b(?:about|around|roughly)?\s*twelve\s*(?:grand|thousand)\b/i, 12000],
    [/\b(?:about|around|roughly)?\s*fifteen\s*(?:grand|thousand)\b/i, 15000],
    [/\b(?:about|around|roughly)?\s*twenty\s*(?:grand|thousand)\b/i, 20000],
    [/\b(?:about|around|roughly)?\s*twenty\s*five\s*(?:grand|thousand)\b/i, 25000],
    [/\b(?:about|around|roughly)?\s*thirty\s*(?:grand|thousand)\b/i, 30000],
    [/\b(?:about|around|roughly)?\s*forty\s*(?:grand|thousand)\b/i, 40000],
    [/\b(?:about|around|roughly)?\s*fifty\s*(?:grand|thousand)\b/i, 50000],
  ]
  for (const [p, val] of wordPatterns) {
    if (p.test(text)) return val
  }

  // Monthly → annual: "£1200 a month" (only in income context)
  const monthlyMatch = text.match(
    /(?:earn|earning|earns|income|salary|paid|get|gets)\s*(?:about|around|roughly)?\s*£([\d,]+)\s*(?:a\s*month|monthly|per\s*month)/i,
  )
  if (monthlyMatch) {
    const monthly = parseAmount(monthlyMatch[1])
    if (monthly && monthly >= 100) return monthly * 12
  }

  return undefined
}

function extractHousingCost(text: string): number | undefined {
  // "mortgage is £2000 a month" / "rent of £600/month" / "£950 a month" near housing words
  const patterns = [
    /(?:mortgage|rent|housing)\s*(?:is|of|about|around|costs?)?\s*£([\d,]+)\s*(?:a\s*month|monthly|per\s*month|\/month|\/mo|pm)\b/i,
    /£([\d,]+)\s*(?:a\s*month|monthly|per\s*month|\/month|\/mo|pm)\b/i,
    /(?:mortgage|rent)\s*.*?£([\d,]+)/i,
    /£([\d,]+)\s*.*?(?:mortgage|rent)/i,
  ]
  for (const p of patterns) {
    const match = text.match(p)
    if (match) {
      const amount = parseAmount(match[1])
      if (amount && amount >= 50 && amount <= 10000) return amount
    }
  }
  return undefined
}

function extractSavings(text: string): number | undefined {
  const patterns = [
    /(?:savings?|saved?|put\s+away)\s*(?:of|about|around|roughly)?\s*£([\d,]+)/i,
    /£([\d,]+)\s*(?:in\s*savings?|saved?)/i,
    /(?:about|around|roughly)\s*£([\d,]+)\s*(?:in\s*savings?|saved?)/i,
  ]
  for (const p of patterns) {
    const match = text.match(p)
    if (match) {
      const amount = parseAmount(match[1])
      if (amount !== undefined) return amount
    }
  }
  return undefined
}

function extractRelationship(
  text: string,
): PersonData['relationship_status'] | undefined {
  const lower = text.toLowerCase()
  if (/\bmy\s+wife\b/.test(lower) || /\bmy\s+husband\b/.test(lower)) return 'couple_married'
  if (/\bmarried\b/.test(lower)) return 'couple_married'
  if (/\bmy\s+partner\b/.test(lower)) return 'couple_cohabiting'
  if (/\b(?:i'm|i am)\s+(?:\d+\s*,?\s*)?single\b/.test(lower)) return 'single'
  if (/\bsingle\b/.test(lower) && !/single\s+person\s+discount/.test(lower)) return 'single'
  if (/\bon\s+my\s+own\b/.test(lower) || /\bjust\s+me\b/.test(lower)) return 'single'
  if (/\bwidow(?:ed|er)?\b/.test(lower)) return 'widowed'
  if (/\bseparated\b/.test(lower)) return 'separated'
  return undefined
}

function extractHousingTenure(text: string): PersonData['housing_tenure'] | undefined {
  const lower = text.toLowerCase()
  if (/\bmortgage\b/.test(lower)) return 'mortgage'
  if (/\b(?:rent|renting)\s*(?:from\s*)?(?:the\s*)?council\b/.test(lower)) return 'rent_social'
  if (/\bcouncil\s+(?:flat|house|property)\b/.test(lower)) return 'rent_social'
  if (/\bsocial\s+(?:housing|rent)\b/.test(lower)) return 'rent_social'
  if (/\brent\s+private(?:ly)?\b/.test(lower)) return 'rent_private'
  if (/\bprivate(?:ly)?\s+rent(?:ing|ed)?\b/.test(lower)) return 'rent_private'
  if (/\brent(?:ing)?\b/.test(lower) && !/council|social/.test(lower)) return 'rent_private'
  if (/\bliving\s+with\s+(?:my\s+)?(?:parents?|family|mum|dad)\b/.test(lower))
    return 'living_with_family'
  if (/\bown\s+(?:our\s+)?(?:house|home|property)\s+outright\b/.test(lower)) return 'own_outright'
  if (/\bown\s+outright\b/.test(lower)) return 'own_outright'
  return undefined
}

interface EmploymentResult {
  status: PersonData['employment_status']
  recentlyRedundant?: boolean
}

function extractEmployment(text: string): EmploymentResult | undefined {
  const lower = text.toLowerCase()
  if (/\b(?:made|been)\s+redundant\b/.test(lower) || /\bredundancy\b/.test(lower)) {
    return { status: 'unemployed', recentlyRedundant: true }
  }
  if (/\blost\s+(?:my|his|her|their)\s+job\b/.test(lower)) {
    return { status: 'unemployed' }
  }
  if (/\bretired\b/.test(lower)) {
    return { status: 'retired' }
  }
  // "I work at" / "work part-time" / "I'm employed" — but NOT "lost my job at"
  if (
    /\b(?:i\s+)?work\s+(?:at|for|part[\s-]*time|full[\s-]*time)\b/.test(lower) ||
    /\b(?:i'm|i am)\s+employed\b/.test(lower) ||
    /\bworking\s+(?:as|at|for)\b/.test(lower)
  ) {
    return { status: 'employed' }
  }
  return undefined
}

interface PregnancyResult {
  isPregnant?: boolean
  firstChild?: boolean
}

function extractPregnancy(text: string): PregnancyResult | undefined {
  const lower = text.toLowerCase()
  const isPregnant =
    /\bpregnant\b/.test(lower) ||
    /\bexpecting\s+(?:a\s+)?(?:baby|child)\b/.test(lower) ||
    /\bwe're\s+expecting\b/.test(lower) ||
    /\bbaby\s+(?:is\s+)?(?:due|on\s+the\s+way)\b/.test(lower)

  if (!isPregnant) return undefined

  const firstChild =
    /\bfirst\s+(?:baby|child)\b/.test(lower) || /\bour\s+first\b/.test(lower)

  return { isPregnant: true, firstChild: firstChild || undefined }
}

function extractChildren(text: string): ChildData[] {
  const children: ChildData[] = []
  const lower = text.toLowerCase()

  // Check for additional needs keywords anywhere in the text
  const hasNeedsKeywords =
    /\b(?:autism|autistic|adhd|sen\b|ehcp|special\s+needs|additional\s+needs|learning\s+difficult|developmental\s+delay)/i.test(
      text,
    )

  // Pattern 1: "3 kids aged 14, 9, and 5" / "children aged 11 and 6"
  const groupMatch = text.match(
    /\b(?:kids?|children|child)\s+(?:are\s+)?aged?\s+([\d,\s]+(?:and\s+\d+)?)/i,
  )
  if (groupMatch) {
    const ageStr = groupMatch[1]
    const ages = ageStr.match(/\d+/g)?.map(Number) ?? []
    for (const age of ages) {
      if (age >= 0 && age <= 18) {
        children.push(makeChild(age, false))
      }
    }
  }

  // Pattern 2: "my 7 year old" / "aged 14" in child context
  if (children.length === 0) {
    const individualMatches = [
      ...text.matchAll(/\b(?:my\s+)?(\d{1,2})\s*[-–]?\s*year[\s-]*old\b/gi),
    ]
    for (const m of individualMatches) {
      const age = parseInt(m[1], 10)
      if (age >= 0 && age <= 18) {
        children.push(makeChild(age, false))
      }
    }
  }

  // Pattern 3: specific ages near child context — "son is 14", "daughter's 9"
  if (children.length === 0) {
    const familyMatches = [
      ...text.matchAll(
        /\b(?:son|daughter|boy|girl|child|kid|youngest|eldest|oldest)\s*(?:is|'s|aged?)\s*(\d{1,2})\b/gi,
      ),
    ]
    for (const m of familyMatches) {
      const age = parseInt(m[1], 10)
      if (age >= 0 && age <= 18) {
        children.push(makeChild(age, false))
      }
    }
  }

  // Mark additional needs on the youngest or the child mentioned near needs keywords
  if (children.length > 0 && hasNeedsKeywords) {
    // Try to identify which child: "youngest has autism" → youngest
    if (/\byoungest\b/i.test(text)) {
      const youngest = children.reduce((a, b) => (a.age < b.age ? a : b))
      youngest.has_additional_needs = true
    } else if (children.length === 1) {
      // Only one child mentioned, it's them
      children[0].has_additional_needs = true
    } else {
      // Find the child mentioned closest to the needs keyword
      // Simple heuristic: mark the last-mentioned child
      children[children.length - 1].has_additional_needs = true
    }
  }

  return children
}

function makeChild(age: number, hasNeeds: boolean): ChildData {
  return {
    age,
    has_additional_needs: hasNeeds,
    disability_benefit: 'none',
    in_education: age >= 4 && age <= 18,
  }
}

function extractCaredForPerson(text: string): CaredForPerson | undefined {
  const lower = text.toLowerCase()

  // Check for parent/elderly relative mention
  const parentPatterns = [
    /\b(?:my\s+)?(?:mum|mom|mother|dad|father|parent)\s*(?:'s|is)\s*(\d{2,3})\b/i,
    /\b(?:my\s+)?(?:mum|mom|mother|dad|father|parent)\s+(?:who's|who\s+is)\s+(\d{2,3})\b/i,
    /\b(?:my\s+)?(?:mum|mom|mother|dad|father|parent)\s+aged?\s+(\d{2,3})\b/i,
  ]

  let relationship: string | undefined
  let age: number | undefined

  for (const p of parentPatterns) {
    const match = text.match(p)
    if (match) {
      age = parseInt(match[1], 10)
      // Determine specific relationship
      const context = match[0].toLowerCase()
      if (/mum|mom|mother/.test(context)) relationship = 'parent'
      else if (/dad|father/.test(context)) relationship = 'parent'
      else relationship = 'parent'
      break
    }
  }

  // Also check without age: "my dad who's 85 and needs help"
  if (!relationship) {
    const noAgeMatch = lower.match(
      /\b(?:my\s+)?(?:mum|mom|mother|dad|father|parent)\b.*?(?:can't\s+cope|needs?\s+help|struggling|frail|unwell|ill|disabled)/,
    )
    if (noAgeMatch) {
      relationship = 'parent'
    }
  }

  if (!relationship) return undefined

  // Check for needs
  const needsHelp =
    /\bcan'?t\s+cope\b/i.test(text) ||
    /\bneeds?\s+help\s+with\b/i.test(text) ||
    /\bhelp\s+with\s+(?:everything|washing|cooking|dressing|medication|tablets)/i.test(text) ||
    /\bstrugg(?:le|ling)\b/i.test(lower) ||
    /\bfrail\b/i.test(lower)

  return {
    relationship,
    age: age ?? 0,
    disability_benefit: 'none',
    needs_help_daily_living: needsHelp,
  }
}

interface CarerResult {
  hoursPerWeek?: number
}

function extractCarer(text: string): CarerResult | undefined {
  const lower = text.toLowerCase()

  const isCarer =
    /\bcaring\s+for\b/.test(lower) ||
    /\blook(?:ing)?\s+after\b/.test(lower) ||
    /\bgo\s+over\s+every\s+day\b/.test(lower) ||
    /\b(?:i'm|i am)\s+(?:a\s+)?carer\b/.test(lower) ||
    /\bhours?\s+a\s+week\b/.test(lower)

  if (!isCarer) return undefined

  // Extract hours
  const hoursMatch = text.match(
    /(?:about|around|roughly|probably)?\s*(\d{1,3})\s*hours?\s*(?:a|per)\s*week/i,
  )
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : undefined

  return { hoursPerWeek: hours }
}

function extractDisabilityOrHealthCondition(text: string): boolean {
  const lower = text.toLowerCase()
  return /\b(?:disability|disabled|health\s+condition|long[\s-]term\s+(?:sick|ill|condition)|MS\b|multiple\s+sclerosis|cancer|arthritis|COPD|diabetes|epilepsy|fibromyalgia|chronic\s+pain|mental\s+health|depression|anxiety|bipolar|schizophrenia|stroke|heart\s+condition|parkinson'?s|dementia|blind|deaf|wheelchair|cerebral\s+palsy|chronic\s+(?:fatigue|illness))/i.test(text) ||
    /\bcan'?t\s+work\s+(?:because|due\s+to)\b/.test(lower)
}

function extractMobilityDifficulty(text: string): boolean {
  return /\b(?:can'?t\s+walk|struggle\s+to\s+walk|wheelchair|mobility\s+scooter|mobility\s+problems?|walking\s+stick|crutches|can'?t\s+get\s+around|housebound|struggle\s+to\s+get\s+out|can'?t\s+leave\s+the\s+house|difficulty\s+(?:walking|getting\s+around|moving))/i.test(text)
}

function extractNeedsHelpDailyLiving(text: string): boolean {
  return /\b(?:need\s+help\s+with\s+(?:washing|dressing|cooking|eating|daily)|can'?t\s+cook|can'?t\s+manage|need\s+(?:help|care)\s+daily|need\s+personal\s+care|help\s+with\s+(?:everything|daily\s+(?:tasks|living))|struggle\s+with\s+daily)/i.test(text)
}

interface BereavementResult {
  relationship?: string
  widowed?: boolean
}

function extractBereavement(text: string): BereavementResult | undefined {
  const lower = text.toLowerCase()

  // Partner/spouse death
  if (/\b(?:widow(?:ed|er)?)\b/.test(lower)) {
    return { relationship: 'partner', widowed: true }
  }
  if (/\b(?:partner|husband|wife|spouse)\s+(?:died|passed\s+away|passed)\b/.test(lower) ||
      /\b(?:lost\s+my\s+(?:partner|husband|wife|spouse))\b/.test(lower)) {
    return { relationship: 'partner', widowed: true }
  }

  // Parent death
  if (/\b(?:mum|dad|mother|father)\s+(?:died|passed\s+away|passed)\b/.test(lower) ||
      /\b(?:lost\s+my\s+(?:mum|dad|mother|father))\b/.test(lower)) {
    return { relationship: 'parent' }
  }

  // General bereavement
  if (/\b(?:bereaved|bereavement)\b/.test(lower)) {
    return {}
  }

  return undefined
}

function extractDisabilityBenefitReceived(text: string): PersonData['disability_benefit_received'] | undefined {
  const lower = text.toLowerCase()

  if (/\b(?:pip\s+enhanced\s+(?:rate\s+)?mobility|pip\s+mobility\s+enhanced|enhanced\s+(?:rate\s+)?mobility)\b/.test(lower))
    return 'pip_mobility_enhanced'
  if (/\b(?:pip\s+(?:standard\s+)?mobility|standard\s+(?:rate\s+)?mobility)\b/.test(lower))
    return 'pip_mobility_standard'
  if (/\b(?:pip\s+enhanced\s+(?:rate\s+)?daily\s+living|pip\s+daily\s+living\s+enhanced|enhanced\s+(?:rate\s+)?daily\s+living)\b/.test(lower))
    return 'pip_daily_living_enhanced'
  if (/\b(?:pip\s+(?:standard\s+)?daily\s+living|on\s+pip|getting\s+pip|receive\s+pip)\b/.test(lower))
    return 'pip_daily_living_standard'
  if (/\b(?:dla\s+higher\s+(?:rate\s+)?mobility)\b/.test(lower))
    return 'dla_higher_mobility'
  if (/\b(?:dla\s+higher\s+(?:rate\s+)?care)\b/.test(lower))
    return 'dla_higher_care'
  if (/\b(?:getting\s+dla|receive\s+dla|on\s+dla)\b/.test(lower))
    return 'dla_middle_care'
  if (/\b(?:attendance\s+allowance)\b/.test(lower))
    return 'attendance_allowance_lower'

  return undefined
}

function extractWaterMeter(text: string): boolean {
  return /\b(?:water\s+meter|metered\s+water|on\s+a\s+meter)\b/i.test(text)
}

function extractMonthsOnUC(text: string): number | undefined {
  // "on UC for a year" / "been on universal credit for 18 months"
  const yearMatch = text.match(/\b(?:on\s+(?:UC|universal\s+credit)\s+(?:for\s+)?(?:about\s+|around\s+|over\s+)?(?:a\s+year|one\s+year|1\s+year|twelve\s+months|12\s+months))\b/i)
  if (yearMatch) return 12
  const monthMatch = text.match(/\b(?:on\s+(?:UC|universal\s+credit)\s+(?:for\s+)?(?:about\s+|around\s+|over\s+)?(\d{1,2})\s+months?)\b/i)
  if (monthMatch) return parseInt(monthMatch[1], 10)
  // "lost my job 10 months ago" + mentions UC → infer months on UC
  const jobLossMatch = text.match(/\b(?:lost\s+(?:my\s+)?job|made\s+redundant|been\s+unemployed)\s+(?:about\s+|around\s+|over\s+)?(\d{1,2})\s+months?\s+ago\b/i)
  if (jobLossMatch && /\b(?:UC|universal\s+credit)\b/i.test(text)) {
    return parseInt(jobLossMatch[1], 10)
  }
  return undefined
}

function extractMedicalExemption(text: string): boolean {
  // Medical conditions that qualify for free NHS prescriptions
  return /\b(?:diabetes|diabetic|hypothyroid|hyperthyroid|thyroid\s+(?:condition|problem)|epilepsy|epileptic|addison'?s|myasthenia\s+gravis|hypoparathyroidism|on\s+(?:lots\s+of|regular|daily)\s+(?:medication|prescriptions?|tablets|pills)|(?:lots\s+of|regular|monthly)\s+prescriptions?|free\s+prescriptions?|medical\s+exemption|exemption\s+cert(?:ificate)?)/i.test(text)
}

// ── Helpers ─────────────────────────────────────────

function parseAmount(str: string): number | undefined {
  const cleaned = str.replace(/,/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? undefined : num
}

function deriveBand(income: number): IncomeBand {
  if (income <= 7400) return 'under_7400'
  if (income <= 12570) return 'under_12570'
  if (income <= 16000) return 'under_16000'
  if (income <= 25000) return 'under_25000'
  if (income <= 50270) return 'under_50270'
  if (income <= 60000) return 'under_60000'
  if (income <= 100000) return 'under_100000'
  if (income <= 125140) return 'under_125140'
  return 'over_125140'
}
