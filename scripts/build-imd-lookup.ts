#!/usr/bin/env npx tsx
/**
 * Build IMD (Index of Multiple Deprivation) lookup
 *
 * Downloads the IMD 2019 dataset from GOV.UK and extracts a compact
 * LSOA-to-deprivation-decile mapping for use in the app.
 *
 * The output is a JSON object: { "E01000001": 5, "E01000002": 3, ... }
 * where the value is the IMD decile (1 = most deprived, 10 = least deprived).
 *
 * Source: English Indices of Deprivation 2019
 * https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019
 *
 * Usage: npx tsx scripts/build-imd-lookup.ts
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CSV_URL = 'https://assets.publishing.service.gov.uk/media/5dc407b440f0b6379a7acc8d/File_7_-_All_IoD2019_Scores__Ranks__Deciles_and_Population_Denominators_3.csv'
const CACHE_PATH = resolve(import.meta.dirname ?? '.', '../.cache/imd-2019-scores.csv')
const OUTPUT_PATH = resolve(import.meta.dirname ?? '.', '../src/data/imd-lookup.json')

async function downloadCSV(): Promise<string> {
  // Use cached copy if available
  if (existsSync(CACHE_PATH)) {
    console.log(`Using cached CSV: ${CACHE_PATH}`)
    return readFileSync(CACHE_PATH, 'utf-8')
  }

  console.log(`Downloading IMD 2019 CSV from GOV.UK...`)
  const res = await fetch(CSV_URL)
  if (!res.ok) throw new Error(`Failed to download: ${res.status}`)
  const text = await res.text()

  // Cache for future runs
  const { mkdirSync } = await import('node:fs')
  mkdirSync(resolve(import.meta.dirname ?? '.', '../.cache'), { recursive: true })
  writeFileSync(CACHE_PATH, text, 'utf-8')
  console.log(`Cached CSV to ${CACHE_PATH}`)

  return text
}

function parseCSV(csv: string): Record<string, number> {
  const lines = csv.split('\n')
  const header = lines[0]

  // Find column indices
  const columns = header.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
  const lsoaIdx = columns.findIndex(c =>
    c.toLowerCase().includes('lsoa code') || c.toLowerCase() === 'lsoa code (2011)')
  const decileIdx = columns.findIndex(c =>
    c.toLowerCase().includes('index of multiple deprivation') && c.toLowerCase().includes('decile'))

  if (lsoaIdx === -1) throw new Error(`Could not find LSOA code column. Headers: ${columns.join(', ')}`)
  if (decileIdx === -1) throw new Error(`Could not find IMD Decile column. Headers: ${columns.join(', ')}`)

  console.log(`LSOA column: [${lsoaIdx}] "${columns[lsoaIdx]}"`)
  console.log(`Decile column: [${decileIdx}] "${columns[decileIdx]}"`)

  const lookup: Record<string, number> = {}
  let skipped = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Simple CSV parsing (no quoted commas in this dataset)
    const fields = line.split(',').map(f => f.trim().replace(/^"|"$/g, ''))
    const lsoa = fields[lsoaIdx]
    const decile = parseInt(fields[decileIdx])

    if (!lsoa || isNaN(decile) || decile < 1 || decile > 10) {
      skipped++
      continue
    }

    lookup[lsoa] = decile
  }

  if (skipped > 0) console.log(`Skipped ${skipped} rows with invalid data`)
  return lookup
}

async function main() {
  const csv = await downloadCSV()
  const lookup = parseCSV(csv)

  const total = Object.keys(lookup).length
  console.log(`\nTotal LSOAs: ${total}`)

  // Distribution across deciles
  const dist = new Map<number, number>()
  for (const decile of Object.values(lookup)) {
    dist.set(decile, (dist.get(decile) ?? 0) + 1)
  }
  console.log('\nDecile distribution:')
  for (let d = 1; d <= 10; d++) {
    const count = dist.get(d) ?? 0
    const bar = '█'.repeat(Math.round(count / 100))
    console.log(`  ${d}: ${count.toLocaleString().padStart(5)} ${bar}`)
  }

  // Write output
  writeFileSync(OUTPUT_PATH, JSON.stringify(lookup) + '\n', 'utf-8')
  const sizeMB = (Buffer.byteLength(JSON.stringify(lookup)) / 1024 / 1024).toFixed(1)
  console.log(`\n✓ Written ${OUTPUT_PATH} (${total} entries, ${sizeMB}MB)`)
}

main()
