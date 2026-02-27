#!/usr/bin/env npx tsx
/**
 * Build tri-nation deprivation lookup
 *
 * Downloads deprivation indices for England, Wales and Scotland, then merges
 * them into a single LSOA/data-zone → decile mapping for use in the app.
 *
 * Output: { "E01000001": 5, "W01000003": 3, "S01006506": 7, ... }
 * where the value is the deprivation decile (1 = most deprived, 10 = least deprived).
 *
 * Sources:
 *   England — IMD 2019: https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019
 *   Wales   — WIMD 2025: https://www.gov.wales/welsh-index-multiple-deprivation-2025
 *   Scotland — SIMD 2020v2: https://www.gov.scot/collections/scottish-index-of-multiple-deprivation-2020/
 *
 * Usage: npx tsx scripts/build-deprivation-lookup.ts
 */

import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const CACHE_DIR = resolve(import.meta.dirname ?? '.', '../.cache')
const OUTPUT_PATH = resolve(import.meta.dirname ?? '.', '../src/data/imd-lookup.json')

// --- England: IMD 2019 (CSV) ---

const IMD_CSV_URL = 'https://assets.publishing.service.gov.uk/media/5dc407b440f0b6379a7acc8d/File_7_-_All_IoD2019_Scores__Ranks__Deciles_and_Population_Denominators_3.csv'
const IMD_CACHE = resolve(CACHE_DIR, 'imd-2019-scores.csv')

async function downloadFile(url: string, cachePath: string, label: string): Promise<Buffer> {
  if (existsSync(cachePath)) {
    console.log(`  Using cached: ${cachePath}`)
    return Buffer.from(readFileSync(cachePath))
  }

  console.log(`  Downloading ${label}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${label}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())

  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(cachePath, buf)
  console.log(`  Cached to ${cachePath}`)
  return buf
}

async function loadEngland(): Promise<Record<string, number>> {
  console.log('\n🏴󠁧󠁢󠁥󠁮󠁧󠁿 England — IMD 2019')
  const buf = await downloadFile(IMD_CSV_URL, IMD_CACHE, 'IMD 2019 CSV')
  const csv = buf.toString('utf-8')

  const lines = csv.split('\n')
  const columns = lines[0].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
  const lsoaIdx = columns.findIndex(c =>
    c.toLowerCase().includes('lsoa code') || c.toLowerCase() === 'lsoa code (2011)')
  const decileIdx = columns.findIndex(c =>
    c.toLowerCase().includes('index of multiple deprivation') && c.toLowerCase().includes('decile'))

  if (lsoaIdx === -1) throw new Error(`Could not find LSOA code column. Headers: ${columns.join(', ')}`)
  if (decileIdx === -1) throw new Error(`Could not find IMD Decile column. Headers: ${columns.join(', ')}`)

  const lookup: Record<string, number> = {}
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const fields = line.split(',').map(f => f.trim().replace(/^"|"$/g, ''))
    const lsoa = fields[lsoaIdx]
    const decile = parseInt(fields[decileIdx])
    if (lsoa && !isNaN(decile) && decile >= 1 && decile <= 10) {
      lookup[lsoa] = decile
    }
  }

  console.log(`  ${Object.keys(lookup).length} LSOAs`)
  return lookup
}

// --- Wales: WIMD 2025 (ODS) ---

const WIMD_ODS_URL = 'https://www.gov.wales/sites/default/files/statistics-and-research/2025-11/wimd-2025-index-and-domain-ranks-by-small-area.ods'
const WIMD_CACHE = resolve(CACHE_DIR, 'wimd-2025-ranks.ods')

async function loadWales(): Promise<Record<string, number>> {
  console.log('\n🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales — WIMD 2025')
  const buf = await downloadFile(WIMD_ODS_URL, WIMD_CACHE, 'WIMD 2025 ODS')

  const XLSX = await import('xlsx')
  const wb = XLSX.read(buf, { type: 'buffer' })

  const ws = wb.Sheets['Deciles_quintiles_quartiles']
  if (!ws) throw new Error(`Sheet 'Deciles_quintiles_quartiles' not found. Sheets: ${wb.SheetNames.join(', ')}`)

  const data: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })

  // Find header row (contains 'LSOA code')
  const headerIdx = data.findIndex(row =>
    row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes('lsoa code')))
  if (headerIdx === -1) throw new Error('Could not find header row with LSOA code')

  const headers = data[headerIdx].map(h => String(h ?? '').toLowerCase())
  const lsoaCol = headers.findIndex(h => h.includes('lsoa code'))
  const decileCol = headers.findIndex(h => h.includes('decile'))
  if (lsoaCol === -1 || decileCol === -1) throw new Error(`Missing columns. Headers: ${headers.join(', ')}`)

  const lookup: Record<string, number> = {}
  for (let i = headerIdx + 1; i < data.length; i++) {
    const row = data[i]
    const lsoa = String(row[lsoaCol] ?? '')
    const decile = Number(row[decileCol])
    if (lsoa.startsWith('W') && !isNaN(decile) && decile >= 1 && decile <= 10) {
      lookup[lsoa] = decile
    }
  }

  console.log(`  ${Object.keys(lookup).length} LSOAs`)
  return lookup
}

// --- Scotland: SIMD 2020v2 (XLSX) ---

const SIMD_XLSX_URL = 'https://www.gov.scot/binaries/content/documents/govscot/publications/statistics/2020/01/scottish-index-of-multiple-deprivation-2020-ranks-and-domain-ranks/documents/scottish-index-of-multiple-deprivation-2020-ranks-and-domain-ranks/scottish-index-of-multiple-deprivation-2020-ranks-and-domain-ranks/govscot%3Adocument/SIMD%2B2020v2%2B-%2Branks.xlsx'
const SIMD_CACHE = resolve(CACHE_DIR, 'simd-2020v2-ranks.xlsx')

function rankToDecile(rank: number, totalZones: number): number {
  // Decile 1 = most deprived (lowest ranks), decile 10 = least deprived
  return Math.min(10, Math.floor((rank - 1) / (totalZones / 10)) + 1)
}

async function loadScotland(): Promise<Record<string, number>> {
  console.log('\n🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland — SIMD 2020v2')
  const buf = await downloadFile(SIMD_XLSX_URL, SIMD_CACHE, 'SIMD 2020v2 XLSX')

  const XLSX = await import('xlsx')
  const wb = XLSX.read(buf, { type: 'buffer' })

  const ws = wb.Sheets['SIMD 2020v2 ranks']
  if (!ws) throw new Error(`Sheet 'SIMD 2020v2 ranks' not found. Sheets: ${wb.SheetNames.join(', ')}`)

  const data: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
  const headers = data[0].map(h => String(h ?? '').toLowerCase())
  const dzCol = headers.findIndex(h => h === 'data_zone')
  const rankCol = headers.findIndex(h => h.includes('simd2020v2_rank'))
  if (dzCol === -1 || rankCol === -1) throw new Error(`Missing columns. Headers: ${headers.join(', ')}`)

  // Count total data zones first (for decile calculation)
  const totalZones = data.length - 1 // exclude header
  console.log(`  Total data zones: ${totalZones}`)

  const lookup: Record<string, number> = {}
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const dz = String(row[dzCol] ?? '')
    const rank = Number(row[rankCol])
    if (dz.startsWith('S') && !isNaN(rank) && rank >= 1) {
      lookup[dz] = rankToDecile(rank, totalZones)
    }
  }

  console.log(`  ${Object.keys(lookup).length} data zones`)
  return lookup
}

// --- Main ---

async function main() {
  console.log('Building tri-nation deprivation lookup...')

  const [england, wales, scotland] = await Promise.all([
    loadEngland(),
    loadWales(),
    loadScotland(),
  ])

  const merged = { ...england, ...wales, ...scotland }
  const total = Object.keys(merged).length

  // Distribution
  const dist = new Map<number, number>()
  for (const decile of Object.values(merged)) {
    dist.set(decile, (dist.get(decile) ?? 0) + 1)
  }

  console.log(`\nMerged: ${total} entries`)
  console.log(`  England: ${Object.keys(england).length}`)
  console.log(`  Wales:   ${Object.keys(wales).length}`)
  console.log(`  Scotland: ${Object.keys(scotland).length}`)

  console.log('\nDecile distribution (all nations):')
  for (let d = 1; d <= 10; d++) {
    const count = dist.get(d) ?? 0
    const bar = '█'.repeat(Math.round(count / 100))
    console.log(`  ${d}: ${count.toLocaleString().padStart(5)} ${bar}`)
  }

  // Validate no overlap
  const eKeys = new Set(Object.keys(england))
  const wKeys = new Set(Object.keys(wales))
  const sKeys = new Set(Object.keys(scotland))
  const ewOverlap = [...eKeys].filter(k => wKeys.has(k))
  const esOverlap = [...eKeys].filter(k => sKeys.has(k))
  const wsOverlap = [...wKeys].filter(k => sKeys.has(k))
  if (ewOverlap.length || esOverlap.length || wsOverlap.length) {
    console.warn(`\nWARNING: Overlapping keys found!`)
    if (ewOverlap.length) console.warn(`  England/Wales: ${ewOverlap.length}`)
    if (esOverlap.length) console.warn(`  England/Scotland: ${esOverlap.length}`)
    if (wsOverlap.length) console.warn(`  Wales/Scotland: ${wsOverlap.length}`)
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(merged) + '\n', 'utf-8')
  const sizeMB = (Buffer.byteLength(JSON.stringify(merged)) / 1024 / 1024).toFixed(1)
  console.log(`\n✓ Written ${OUTPUT_PATH} (${total} entries, ${sizeMB}MB)`)
}

main()
