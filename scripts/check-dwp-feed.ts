#!/usr/bin/env npx tsx
/**
 * DWP Atom feed monitor
 *
 * Checks the DWP publications Atom feed for new "benefit and pension rates"
 * publications. If a publication is newer than our last_updated date in
 * benefit-rates.json, outputs a GitHub Actions output variable to trigger
 * the rate update workflow.
 *
 * Usage: npx tsx scripts/check-dwp-feed.ts
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { appendFileSync } from 'node:fs'

const FEED_URL = 'https://www.gov.uk/search/all.atom?keywords=benefit+pension+rates&organisations%5B%5D=department-for-work-pensions'
const RATES_PATH = resolve(import.meta.dirname ?? '.', '../src/data/benefit-rates.json')

async function main() {
  // Load current last_updated date
  const ratesFile = JSON.parse(readFileSync(RATES_PATH, 'utf-8'))
  const lastUpdated = new Date(ratesFile.last_updated)
  console.log(`Current last_updated: ${ratesFile.last_updated}`)

  // Fetch Atom feed
  console.log(`Fetching DWP Atom feed...`)
  const res = await fetch(FEED_URL)
  if (!res.ok) {
    console.error(`Failed to fetch feed: ${res.status}`)
    setOutput('new_publication', 'false')
    process.exit(0)
  }

  const xml = await res.text()

  // Parse <entry> elements — simple regex-based since we only need <updated> and <title>
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
  console.log(`Found ${entries.length} feed entries`)

  let hasNewPublication = false

  for (const [, entryXml] of entries.slice(0, 5)) { // Check first 5 entries
    const titleMatch = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/)
    const updatedMatch = entryXml.match(/<updated>([\s\S]*?)<\/updated>/)

    const title = titleMatch?.[1]?.trim() ?? ''
    const updated = updatedMatch?.[1]?.trim() ?? ''

    // Only care about benefit/pension rate publications
    if (!title.toLowerCase().includes('benefit') && !title.toLowerCase().includes('pension')) {
      continue
    }
    if (!title.toLowerCase().includes('rate')) {
      continue
    }

    const entryDate = new Date(updated)
    console.log(`  Entry: "${title}" (updated: ${updated})`)

    if (entryDate > lastUpdated) {
      console.log(`  → NEWER than our last_updated (${ratesFile.last_updated})`)
      hasNewPublication = true
      break
    }
  }

  if (hasNewPublication) {
    console.log('\n✓ New rate publication detected — triggering update')
  } else {
    console.log('\n✓ No new rate publications found')
  }

  setOutput('new_publication', hasNewPublication ? 'true' : 'false')
}

/** Set a GitHub Actions output variable */
function setOutput(name: string, value: string) {
  console.log(`::set-output name=${name}::${value}`) // Legacy format (fallback)
  const outputFile = process.env.GITHUB_OUTPUT
  if (outputFile) {
    appendFileSync(outputFile, `${name}=${value}\n`)
  }
}

main()
