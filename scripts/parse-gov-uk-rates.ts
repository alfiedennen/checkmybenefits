/**
 * GOV.UK Content API rate parser
 *
 * Fetches individual benefit pages from the GOV.UK Content API and extracts
 * rate values from HTML tables and prose. Each benefit has a dedicated parser
 * because the HTML structure varies across pages.
 */

import * as cheerio from 'cheerio'

// GOV.UK Content API base — returns JSON with HTML body, no auth needed
const API_BASE = 'https://www.gov.uk/api/content'

interface GovUkPart {
  body: string
  slug: string
  title: string
}

interface GovUkContentResponse {
  details: {
    body?: string
    parts?: GovUkPart[]
  }
}

/** Extract a number from text like "£73.90" or "£1,031.88" or "£16,000" */
function extractAmount(text: string): number | null {
  const match = text.match(/£([\d,]+(?:\.\d{1,2})?)/)
  if (!match) return null
  return parseFloat(match[1].replace(/,/g, ''))
}

/** Extract all amounts from text */
function extractAllAmounts(text: string): number[] {
  const matches = text.matchAll(/£([\d,]+(?:\.\d{1,2})?)/g)
  return [...matches].map(m => parseFloat(m[1].replace(/,/g, '')))
}

/** Fetch a GOV.UK Content API page */
async function fetchPage(path: string): Promise<GovUkContentResponse> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json() as Promise<GovUkContentResponse>
}

/** Get HTML body for a specific part slug, or the main body */
function getPartBody(data: GovUkContentResponse, slug?: string): string {
  if (slug && data.details.parts) {
    const part = data.details.parts.find(p => p.slug === slug)
    if (part) return part.body
  }
  return data.details.body ?? data.details.parts?.map(p => p.body).join('\n') ?? ''
}

// ── Individual benefit parsers ──────────────────────────────────────────

export async function parseAttendanceAllowance(): Promise<Record<string, number>> {
  const data = await fetchPage('/attendance-allowance')
  const html = getPartBody(data, 'what-youll-get')
  const $ = cheerio.load(html)

  const rates: Record<string, number> = {}

  // Table with "Lower rate - £73.90" and "Higher rate - £110.40" pattern
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td')
    const text = cells.first().text()
    const amount = extractAmount(text)
    if (amount) {
      if (text.toLowerCase().includes('lower')) rates.lower_weekly = amount
      if (text.toLowerCase().includes('higher')) rates.higher_weekly = amount
    }
  })

  // Fallback: parse from prose if table not found
  if (!rates.lower_weekly || !rates.higher_weekly) {
    const allText = $.text()
    const amounts = extractAllAmounts(allText)
    // AA has exactly 2 rates: lower and higher
    if (amounts.length >= 2) {
      const sorted = [...new Set(amounts)].sort((a, b) => a - b)
      if (sorted.length >= 2) {
        rates.lower_weekly = sorted[0]
        rates.higher_weekly = sorted[1]
      }
    }
  }

  return rates
}

export async function parsePensionCredit(): Promise<Record<string, number>> {
  const data = await fetchPage('/pension-credit')
  const html = getPartBody(data, 'what-youll-get')
  const $ = cheerio.load(html)
  const text = $.text()
  const rates: Record<string, number> = {}

  // PC rates are in prose: "your weekly income to £227.10 if you're single"
  const singleMatch = text.match(/(?:income\s+to|topped\s+up\s+to)\s+£([\d,]+\.\d{2}).*?single/i)
  if (singleMatch) rates.single_weekly = parseFloat(singleMatch[1].replace(/,/g, ''))

  const coupleMatch = text.match(/(?:income\s+to|topped\s+up\s+to)\s+£([\d,]+\.\d{2}).*?partner/i)
    ?? text.match(/£([\d,]+\.\d{2}).*?(?:couple|partner)/i)
  if (coupleMatch) rates.couple_weekly = parseFloat(coupleMatch[1].replace(/,/g, ''))

  // Savings credit — "up to £17.30 Savings Credit a week if you're single.
  //   If you have a partner, you'll get up to £19.36 a week."
  const savingsSection = text.match(/Savings\s+Credit[\s\S]{0,500}/i)?.[0] ?? ''
  const savSingleMatch = savingsSection.match(/£([\d,]+\.\d{2}).*?single/i)
  if (savSingleMatch) rates.savings_credit_single_max_weekly = parseFloat(savSingleMatch[1].replace(/,/g, ''))

  // Partner amount follows after the single amount — match "partner" near a £amount
  const savCoupleMatch = savingsSection.match(/partner.*?£([\d,]+\.\d{2})/i)
    ?? savingsSection.match(/£([\d,]+\.\d{2}).*?partner/i)
  if (savCoupleMatch) {
    rates.savings_credit_couple_max_weekly = parseFloat(savCoupleMatch[1].replace(/,/g, ''))
  }

  // Capital disregard — typically £10,000, may be in prose
  const capitalMatch = text.match(/£([\d,]+)\s+(?:or less\s+)?(?:in\s+)?(?:savings|capital)/i)
  if (capitalMatch) rates.capital_disregard = parseFloat(capitalMatch[1].replace(/,/g, ''))

  return rates
}

export async function parseCarersAllowance(): Promise<Record<string, number>> {
  const data = await fetchPage('/carers-allowance')
  const allHtml = data.details.parts?.map(p => p.body).join('\n') ?? ''
  const $ = cheerio.load(allHtml)
  const text = $.text()
  const rates: Record<string, number> = {}

  // "£83.30 a week"
  const weeklyMatch = text.match(/£([\d,]+\.\d{2})\s+a\s+week/i)
  if (weeklyMatch) rates.weekly = parseFloat(weeklyMatch[1].replace(/,/g, ''))

  // Earnings limit: "£196 or less a week"
  const earningsMatch = text.match(/(?:earnings\s+are\s+)?£([\d,]+(?:\.\d{2})?)\s+(?:or\s+less\s+)?a?\s*week/i)
  if (earningsMatch) {
    const val = parseFloat(earningsMatch[1].replace(/,/g, ''))
    if (val !== rates.weekly) rates.earnings_limit_weekly = val
  }

  return rates
}

export async function parseChildBenefit(): Promise<Record<string, number>> {
  const data = await fetchPage('/child-benefit')
  const html = getPartBody(data, 'what-youll-get')
  const $ = cheerio.load(html)
  const rates: Record<string, number> = {}

  // Table: "Eldest or only child" → rate, "Additional children" → rate
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td')
    const label = cells.first().text().toLowerCase()
    const amount = extractAmount(cells.last().text())
    if (amount) {
      if (label.includes('eldest') || label.includes('only') || label.includes('first')) {
        rates.first_child_weekly = amount
      }
      if (label.includes('additional') || label.includes('other')) {
        rates.additional_child_weekly = amount
      }
    }
  })

  // HICBC thresholds from the tax charge page
  try {
    const hicbcData = await fetchPage('/child-benefit-tax-charge')
    const hicbcHtml = hicbcData.details.parts?.map(p => p.body).join('\n') ?? hicbcData.details.body ?? ''
    const hicbcText = cheerio.load(hicbcHtml).text()
    const thresholdMatch = hicbcText.match(/(?:adjusted\s+net\s+income\s+is\s+(?:over|more\s+than)\s+)?£([\d,]+)/i)
    if (thresholdMatch) rates.hicbc_threshold = parseFloat(thresholdMatch[1].replace(/,/g, ''))
    const fullMatch = hicbcText.match(/£([\d,]+).*?(?:equal\s+to|100%|all\s+of)/i)
    if (fullMatch) {
      const val = parseFloat(fullMatch[1].replace(/,/g, ''))
      if (val > (rates.hicbc_threshold ?? 0)) rates.hicbc_full_clawback = val
    }
  } catch {
    // HICBC page may not exist or may have different structure
  }

  return rates
}

export async function parsePIP(): Promise<Record<string, number>> {
  const data = await fetchPage('/pip')
  const html = getPartBody(data, 'how-much-youll-get')
  const $ = cheerio.load(html)
  const rates: Record<string, number> = {}

  // PIP table structure:
  //   <th></th> <th>Lower weekly rate</th> <th>Higher weekly rate</th>
  //   <th>Daily living part</th> <td>£73.90</td> <td>£110.40</td>
  //   <th>Mobility part</th> <td>£29.20</td> <td>£77.05</td>
  $('table').each((_, table) => {
    $(table).find('tbody tr').each((_, row) => {
      const rowHeader = $(row).find('th').text().toLowerCase()
      const cells = $(row).find('td')
      // Extract all numeric amounts from td cells
      const amounts = cells.map((_, c) => extractAmount($(c).text())).get().filter(Boolean) as number[]

      if (rowHeader.includes('daily living') && amounts.length >= 2) {
        rates.daily_living_standard_weekly = Math.min(...amounts)
        rates.daily_living_enhanced_weekly = Math.max(...amounts)
      }

      if (rowHeader.includes('mobility') && amounts.length >= 2) {
        rates.mobility_standard_weekly = Math.min(...amounts)
        rates.mobility_enhanced_weekly = Math.max(...amounts)
      }
    })
  })

  return rates
}

export async function parseUniversalCredit(): Promise<Record<string, number>> {
  const data = await fetchPage('/universal-credit')
  const html = getPartBody(data, 'what-youll-get')
  const $ = cheerio.load(html)
  const rates: Record<string, number> = {}

  // UC page has multiple tables each with 2 columns: description | amount
  // Some entries have the amount embedded in the label text (disabled child)
  $('table').each((_, table) => {
    $(table).find('tbody tr').each((_, row) => {
      const cells = $(row).find('td')
      // Combine all cell text for matching, extract amount from any cell
      const fullText = cells.map((_, c) => $(c).text()).get().join(' ').toLowerCase()
      const amounts = cells.map((_, c) => extractAmount($(c).text())).get().filter(Boolean) as number[]
      // Try last cell first (typical: label | £amount), fall back to any cell
      const amount = amounts.length > 0 ? amounts[amounts.length - 1] : null
      if (!amount && amounts.length === 0) return

      const amt = amount!

      // Standard allowance
      if (fullText.includes('single') && fullText.includes('under 25')) {
        rates.standard_allowance_single_under_25_monthly = amt
      } else if (fullText.includes('single') && fullText.includes('25 or over')) {
        rates.standard_allowance_single_25_plus_monthly = amt
      } else if (fullText.includes('partner') && fullText.includes('both under 25')) {
        rates.standard_allowance_couple_under_25_monthly = amt
      } else if (fullText.includes('partner') && fullText.includes('25 or over')) {
        rates.standard_allowance_couple_25_plus_monthly = amt

      // Child elements
      } else if (fullText.includes('first child') && fullText.includes('before')) {
        rates.child_element_first_monthly = amt
      } else if (fullText.includes('second child') || fullText.includes('other eligible children')) {
        rates.child_element_subsequent_monthly = amt
      } else if (fullText.includes('first child') && fullText.includes('after')) {
        if (!rates.child_element_subsequent_monthly) rates.child_element_subsequent_monthly = amt

      // Disabled child — amounts often in the label cell: "£158.76 - the lower amount"
      } else if (fullText.includes('lower amount')) {
        rates.disabled_child_lower_monthly = amounts[0] ?? amt
      } else if (fullText.includes('higher amount')) {
        rates.disabled_child_higher_monthly = amounts[0] ?? amt

      // LCWRA
      } else if (fullText.includes('limited capability') && fullText.includes('work-related activity')) {
        rates.lcwra_element_monthly = amt
      }
    })
  })

  // Get full page text for prose-based matching
  const allHtml = data.details.parts?.map(p => p.body).join('\n') ?? html
  const allText = cheerio.load(allHtml).text()
  const text = $.text()

  // Carer element — may be in a different part of the page
  const carerMatch = allText.match(/carer['s]*\s+element.*?£([\d,]+\.\d{2})/i)
    ?? allText.match(/£([\d,]+\.\d{2}).*?carer/i)
  if (carerMatch) rates.carer_element_monthly = parseFloat(carerMatch[1].replace(/,/g, ''))

  // Childcare caps — in prose: "£1,031.88 for one child" / "£1,768.94 for two"
  const childcare1Match = allText.match(/£([\d,]+\.\d{2}).*?(?:one child|1 child)/i)
  if (childcare1Match) rates.childcare_one_child_max_monthly = parseFloat(childcare1Match[1].replace(/,/g, ''))

  const childcare2Match = allText.match(/£([\d,]+\.\d{2}).*?(?:two|2|more)\s+child/i)
  if (childcare2Match) rates.childcare_two_children_max_monthly = parseFloat(childcare2Match[1].replace(/,/g, ''))

  // Capital thresholds — "£16,000 or less" and "more than £6,000"
  // Also matches "between £6,000 and £16,000"
  const upperMatch = text.match(/£([\d,]+)\s+or\s+less.*?(?:savings|investment|money)/i)
    ?? text.match(/and\s+£([\d,]+)\s*\./i)
    ?? text.match(/between.*?and\s+£([\d,]+)/i)
  if (upperMatch) rates.capital_upper_threshold = parseFloat(upperMatch[1].replace(/,/g, ''))

  const lowerMatch = text.match(/(?:more than|over)\s+£([\d,]+).*?(?:savings|investment|money)/i)
    ?? text.match(/between\s+£([\d,]+)/i)
  if (lowerMatch) rates.capital_lower_threshold = parseFloat(lowerMatch[1].replace(/,/g, ''))

  // Free school meals income threshold — may be on a different page
  const fsmMatch = text.match(/(?:earn|income).*?£([\d,]+).*?(?:free school meals|fsm)/i)
    ?? text.match(/free school meals.*?£([\d,]+)/i)
  if (fsmMatch) rates.free_school_meals_income_threshold = parseFloat(fsmMatch[1].replace(/,/g, ''))

  return rates
}

export async function parseMaternityAllowance(): Promise<Record<string, number>> {
  const data = await fetchPage('/maternity-allowance')
  const html = data.details.parts?.map(p => p.body).join('\n') ?? ''
  const text = cheerio.load(html).text()
  const rates: Record<string, number> = {}

  const weeklyMatch = text.match(/£([\d,]+\.\d{2})\s+a?\s*week/i)
  if (weeklyMatch) rates.weekly = parseFloat(weeklyMatch[1].replace(/,/g, ''))

  const weeksMatch = text.match(/(\d+)\s+weeks/i)
  if (weeksMatch) rates.duration_weeks = parseInt(weeksMatch[1])

  return rates
}

export async function parseMarriageAllowance(): Promise<Record<string, number>> {
  const data = await fetchPage('/marriage-allowance')
  const html = data.details.parts?.map(p => p.body).join('\n') ?? data.details.body ?? ''
  const text = cheerio.load(html).text()
  const rates: Record<string, number> = {}

  // "transfer £1,260" and "reduce tax by up to £252"
  const transferMatch = text.match(/transfer\s+£([\d,]+)/i)
  if (transferMatch) rates.transferable_amount = parseFloat(transferMatch[1].replace(/,/g, ''))

  const valueMatch = text.match(/(?:reduce|save).*?£([\d,]+(?:\.\d{2})?)/i)
  if (valueMatch) rates.annual_value = parseFloat(valueMatch[1].replace(/,/g, ''))

  // Backdate years
  const backdateMatch = text.match(/(?:backdate|back date).*?(\d+)\s+year/i)
  if (backdateMatch) rates.backdate_years = parseInt(backdateMatch[1])

  return rates
}

export async function parseBereavementSupport(): Promise<Record<string, number>> {
  const data = await fetchPage('/bereavement-support-payment')
  const html = getPartBody(data, 'what-youll-get')
  const $ = cheerio.load(html)
  const rates: Record<string, number> = {}

  // Table or prose with higher/standard rates
  $('table tbody tr').each((_, row) => {
    const cells = $(row).find('td, th')
    const label = cells.first().text().toLowerCase()
    const amounts = cells.map((_, c) => extractAmount($(c).text())).get().filter(Boolean) as number[]

    if (label.includes('higher')) {
      if (amounts.length >= 2) {
        rates.higher_lump_sum = Math.max(...amounts)
        rates.higher_monthly = Math.min(...amounts)
      } else if (amounts.length === 1) {
        rates.higher_lump_sum = amounts[0]
      }
    }
    if (label.includes('standard')) {
      if (amounts.length >= 2) {
        rates.standard_lump_sum = Math.max(...amounts)
        rates.standard_monthly = Math.min(...amounts)
      } else if (amounts.length === 1) {
        rates.standard_lump_sum = amounts[0]
      }
    }
  })

  // Duration
  const text = $.text()
  const monthsMatch = text.match(/(\d+)\s+month/i)
  if (monthsMatch) rates.duration_months = parseInt(monthsMatch[1])

  return rates
}

export async function parseStatePension(): Promise<Record<string, number>> {
  const data = await fetchPage('/new-state-pension')
  const html = data.details.parts?.map(p => p.body).join('\n') ?? ''
  const text = cheerio.load(html).text()
  const rates: Record<string, number> = {}

  // "full new State Pension is £230.25 per week"
  const weeklyMatch = text.match(/(?:full|maximum).*?£([\d,]+\.\d{2}).*?(?:per\s+)?week/i)
  if (weeklyMatch) rates.state_pension_full_new_weekly = parseFloat(weeklyMatch[1].replace(/,/g, ''))

  return rates
}

// ── Aggregate all parsers ───────────────────────────────────────────────

export interface ParsedRates {
  attendance_allowance: Record<string, number>
  pension_credit: Record<string, number>
  carers_allowance: Record<string, number>
  child_benefit: Record<string, number>
  universal_credit: Record<string, number>
  pip: Record<string, number>
  marriage_allowance: Record<string, number>
  maternity_allowance: Record<string, number>
  bereavement_support_payment: Record<string, number>
  state_pension: Record<string, number>
}

export async function parseAllRates(): Promise<ParsedRates> {
  // Run all parsers in parallel
  const [
    attendance_allowance,
    pension_credit,
    carers_allowance,
    child_benefit,
    pip,
    universal_credit,
    marriage_allowance,
    maternity_allowance,
    bereavement_support_payment,
    state_pension,
  ] = await Promise.all([
    parseAttendanceAllowance(),
    parsePensionCredit(),
    parseCarersAllowance(),
    parseChildBenefit(),
    parsePIP(),
    parseUniversalCredit(),
    parseMarriageAllowance(),
    parseMaternityAllowance(),
    parseBereavementSupport(),
    parseStatePension(),
  ])

  return {
    attendance_allowance,
    pension_credit,
    carers_allowance,
    child_benefit,
    universal_credit,
    pip,
    marriage_allowance,
    maternity_allowance,
    bereavement_support_payment,
    state_pension,
  }
}
