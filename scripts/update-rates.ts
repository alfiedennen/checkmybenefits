#!/usr/bin/env npx tsx
/**
 * Benefit rate auto-updater
 *
 * Fetches current benefit rates from GOV.UK Content API,
 * validates against the existing rates, and writes updated
 * benefit-rates.json if values have changed.
 *
 * Usage: npx tsx scripts/update-rates.ts
 *
 * Exit codes:
 *   0 — success (updated or no changes)
 *   1 — validation errors (rates not written)
 *   2 — fetch/parse errors
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseAllRates } from './parse-gov-uk-rates.js'
import { validateRates } from './validate-rates.js'

const RATES_PATH = resolve(import.meta.dirname ?? '.', '../src/data/benefit-rates.json')

interface BenefitRatesFile {
  tax_year: string
  last_updated: string
  source: string
  rates: Record<string, unknown>
}

async function main() {
  console.log('Fetching benefit rates from GOV.UK Content API...\n')

  // Load current rates
  const currentFile: BenefitRatesFile = JSON.parse(readFileSync(RATES_PATH, 'utf-8'))
  const currentRates = currentFile.rates

  // Fetch and parse new rates
  let parsed
  try {
    parsed = await parseAllRates()
  } catch (err) {
    console.error('Failed to fetch/parse rates:', err)
    process.exit(2)
  }

  // Merge parsed rates into the existing structure
  // We only update values we successfully parsed — missing values keep their old values
  const updatedRates = { ...currentRates } as Record<string, unknown>

  let changedCount = 0
  let unchangedCount = 0
  let missingCount = 0

  for (const [benefit, parsedValues] of Object.entries(parsed)) {
    const existing = (currentRates as Record<string, Record<string, unknown>>)[benefit]

    if (existing && typeof existing === 'object') {
      // Nested benefit object (e.g., attendance_allowance: { lower_weekly: 73.9, ... })
      const updated = { ...existing }
      for (const [key, newVal] of Object.entries(parsedValues)) {
        if (typeof newVal !== 'number' || isNaN(newVal)) continue

        const oldVal = existing[key]
        if (typeof oldVal === 'number' && oldVal === newVal) {
          unchangedCount++
        } else if (typeof oldVal === 'number') {
          console.log(`  ✓ ${benefit}.${key}: ${oldVal} → ${newVal}`)
          changedCount++
        } else {
          console.log(`  + ${benefit}.${key}: ${newVal} (new)`)
          changedCount++
        }
        updated[key] = newVal
      }

      // Count keys we didn't parse (keep old values)
      for (const key of Object.keys(existing)) {
        if (key === 'source') continue
        if (!(key in parsedValues)) {
          missingCount++
        }
      }

      updatedRates[benefit] = updated
    } else {
      // Flat keys in the rates object (e.g., state_pension parser returns
      // { state_pension_full_new_weekly: 230.25 } and the key lives at rates.state_pension_full_new_weekly)
      for (const [key, newVal] of Object.entries(parsedValues)) {
        if (typeof newVal !== 'number' || isNaN(newVal)) continue

        const oldVal = currentRates[key]
        if (typeof oldVal === 'number' && oldVal === newVal) {
          unchangedCount++
        } else if (typeof oldVal === 'number') {
          console.log(`  ✓ ${key}: ${oldVal} → ${newVal}`)
          changedCount++
        } else {
          console.log(`  + ${key}: ${newVal} (new)`)
          changedCount++
        }
        updatedRates[key] = newVal
      }
    }
  }

  console.log(`\nParsed: ${changedCount} changed, ${unchangedCount} unchanged, ${missingCount} kept from existing\n`)

  if (changedCount === 0) {
    console.log('No rate changes detected. benefit-rates.json is up to date.')
    return
  }

  // Validate before writing
  const validation = validateRates(updatedRates, currentRates as Record<string, unknown>, currentFile.tax_year)

  if (validation.warnings.length > 0) {
    console.log('Warnings:')
    for (const w of validation.warnings) console.log(`  ⚠ ${w}`)
    console.log()
  }

  if (!validation.valid) {
    console.error('Validation FAILED — rates not written:')
    for (const e of validation.errors) console.error(`  ✗ ${e}`)
    process.exit(1)
  }

  // Write updated file
  const updatedFile: BenefitRatesFile = {
    tax_year: currentFile.tax_year,
    last_updated: new Date().toISOString().split('T')[0],
    source: currentFile.source,
    rates: updatedRates,
  }

  writeFileSync(RATES_PATH, JSON.stringify(updatedFile, null, 2) + '\n', 'utf-8')
  console.log(`✓ Updated benefit-rates.json (${changedCount} changes)`)
}

main()
