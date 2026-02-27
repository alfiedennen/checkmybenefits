# Feature Spec: Area Deprivation in Eligibility Rules

## Summary

Use the deprivation decile already on `PersonData` to improve eligibility confidence for area-based entitlements. Extend the IMD lookup to cover Wales (WIMD) and Scotland (SIMD) so deprivation checks work for all three nations.

## What exists today

| Component | Status |
|-----------|--------|
| `deprivation.ts` — `getDeprivationDecile()`, `isDeprivedArea()` | Working, England only |
| `imd-lookup.json` — 32K English LSOAs → deciles | Working |
| `useConversation.ts` — sets `deprivation_decile` on PersonData | Working |
| `postcodes.ts` — returns LSOA codes for all nations | Working |
| `build-imd-lookup.ts` — downloads English IMD CSV | Working |
| Any eligibility rule that reads `deprivation_decile` | **Does not exist** |

## What we're building

### 1. Tri-nation deprivation lookup

Extend `build-imd-lookup.ts` (rename to `build-deprivation-lookup.ts`) to download and merge:

| Nation | Dataset | Geography unit | Source | Size |
|--------|---------|---------------|--------|------|
| England | IMD 2019 | LSOA (`E01...`) | [GOV.UK CSV](https://assets.publishing.service.gov.uk/media/5dc407b440f0b6379a7acc8d/File_7_-_All_IoD2019_Scores__Ranks__Deciles_and_Population_Denominators_3.csv) | 32,844 rows |
| Wales | WIMD 2019 | LSOA (`W01...`) | [StatsWales CSV](https://statswales.gov.wales/Catalogue/Community-Safety-and-Social-Inclusion/Welsh-Index-of-Multiple-Deprivation/WIMD-2019/welshindexofmultipledeprivation2019-by-rank-decileandquintile-lowerlayersuperoutputarea) | ~1,909 rows |
| Scotland | SIMD 2020v2 | Data zone (`S01...`) | [gov.scot Excel](https://www.gov.scot/publications/scottish-index-of-multiple-deprivation-2020v2-ranks/) | ~6,976 rows |

All three use a 1–10 decile scale (1 = most deprived). The merged output stays as `imd-lookup.json` — same format, just more keys. ~41K entries, ~490KB.

**Note:** The three indices use different methodologies and are not directly comparable across nations. But within each nation, "decile 1–3 = most deprived 30%" is a valid proxy for area-based eligibility checks. This matches how the schemes themselves define eligibility.

### 2. Eligibility rule changes

Four entitlements gain deprivation awareness:

#### `eco_home_insulation` (England)
ECO4 LA-flex explicitly targets households in IMD deciles 1–3.

```
Current:  income < £25k → worth_checking
Proposed: income < £25k AND deprived area → possible
          income < £25k AND non-deprived   → worth_checking (unchanged)
          income < £16k AND deprived area → likely (was possible)
```

#### `warm_home_discount` (England + Wales)
WHD Core Group 2 uses a deprivation-weighted algorithm. Being in a deprived area increases likelihood.

```
Current:  low income → possible
Proposed: low income AND deprived area → likely (confidence boost only)
          low income AND non-deprived   → possible (unchanged)
```

#### `flying_start_wales` (Wales)
Flying Start is explicitly area-based — only available in deprived postcodes.

```
Current:  always worth_checking (can't tell if area qualifies)
Proposed: deprived area (WIMD decile 1-3) → possible
          non-deprived                     → worth_checking (unchanged)
```

#### `free_childcare_15hrs_disadvantaged` (England)
Some LAs extend 2-year-old funding to deprived areas regardless of benefit receipt.

```
Current:  income check only
Proposed: has 2yo AND deprived area AND not already eligible by income → possible
          (additive — doesn't change existing income-based eligible results)
```

### 3. Graceful degradation

Deprivation checks are **additive only** — they can boost confidence but never reduce it or block eligibility. If `deprivation_decile` is missing (partial postcode, lookup miss), the rule falls through to existing logic. No regression.

| Scenario | Deprivation available? | Behaviour |
|----------|----------------------|-----------|
| Full postcode, English | Yes | Full deprivation check |
| Full postcode, Welsh | Yes (after WIMD added) | Full deprivation check |
| Full postcode, Scottish | Yes (after SIMD added) | Full deprivation check |
| Partial postcode (any nation) | No | Skip deprivation, use existing logic |
| LSOA not in lookup | No | Skip deprivation, use existing logic |

## Eval scenarios

### Deterministic tests (Vitest — no AI)

Add to `entitlement-matrix.test.ts`:

| ID | Persona | deprivation_decile | Asserts |
|----|---------|-------------------|---------|
| DEP-01 | Low income, deprived area (decile 2), England | 2 | `eco_home_insulation` confidence = `likely` |
| DEP-02 | Low income, affluent area (decile 8), England | 8 | `eco_home_insulation` confidence = `possible` |
| DEP-03 | Medium income (£20k), deprived area, England | 2 | `eco_home_insulation` eligible, confidence = `possible` |
| DEP-04 | Medium income (£20k), affluent area, England | 8 | `eco_home_insulation` confidence = `worth_checking` |
| DEP-05 | Low income, deprived area, England | 2 | `warm_home_discount` confidence = `likely` |
| DEP-06 | Low income, non-deprived area, England | 7 | `warm_home_discount` confidence = `possible` |
| DEP-07 | Parent of 2yo, deprived area, Wales, WIMD decile 1 | 1 | `flying_start_wales` confidence = `possible` |
| DEP-08 | Parent of 2yo, affluent area, Wales, WIMD decile 9 | 9 | `flying_start_wales` confidence = `worth_checking` |
| DEP-09 | Parent of 2yo, no deprivation data (partial postcode) | undefined | `flying_start_wales` confidence = `worth_checking` (no regression) |
| DEP-10 | Parent of 2yo, deprived area, England, decile 2 | 2 | `free_childcare_15hrs_disadvantaged` eligible = true |
| DEP-11 | Parent of 2yo, affluent area, England, high income | 9 | `free_childcare_15hrs_disadvantaged` eligible = false (unchanged) |
| DEP-12 | Low income, no deprivation data, England | undefined | `eco_home_insulation` confidence = `possible` (no regression from today) |

### Deprivation lookup tests

Add to `deprivation.test.ts`:

| ID | Test |
|----|------|
| DLOOK-01 | Welsh LSOA (`W01...`) returns valid decile 1-10 |
| DLOOK-02 | Scottish data zone (`S01...`) returns valid decile 1-10 |
| DLOOK-03 | English LSOA still works (no regression) |
| DLOOK-04 | Unknown code returns null |
| DLOOK-05 | `isDeprivedArea()` true for deciles 1-3, false for 4-10, false for null |

### Build script tests

| ID | Test |
|----|------|
| BUILD-01 | Merged lookup has entries starting with `E01`, `W01`, and `S01` |
| BUILD-02 | All decile values are integers 1-10 |
| BUILD-03 | Total entries > 40,000 (32K England + 1.9K Wales + 7K Scotland) |
| BUILD-04 | No duplicate keys across nations |

## Files changed

| File | Change |
|------|--------|
| `scripts/build-imd-lookup.ts` | Rename to `build-deprivation-lookup.ts`. Add WIMD + SIMD download/parse. Merge into single output. |
| `src/data/imd-lookup.json` | Grows from ~32K to ~41K entries |
| `src/engine/eligibility-rules.ts` | Update 4 rules to read `deprivation_decile` |
| `src/services/deprivation.ts` | No changes needed (already nation-agnostic) |
| `tests/engine/deprivation.test.ts` | Add DLOOK-01 to DLOOK-05 |
| `tests/engine/entitlement-matrix.test.ts` | Add DEP-01 to DEP-12 |
| `package.json` | Update `build-imd` script to point to new filename |
| `eligibility-sources.md` | Add deprivation section back with tri-nation coverage |
| `TESTING.md` | Document new test scenarios |

## Not in scope

- **Northern Ireland** — NIMDM exists but we don't cover NI entitlements yet
- **Changing the conversation flow** — deprivation is derived from postcode, no new questions needed
- **Using deprivation for value estimation** — only for eligibility confidence
- **Council Tax Support** — even with deprivation data, 300+ local schemes remain impossible to model
- **Updating IMD to 2024/WIMD to 2025** — use current published datasets first, upgrade later

## Risks

| Risk | Mitigation |
|------|-----------|
| StatsWales CSV format changes | Cache locally, validate structure in build script |
| SIMD Excel format changes | Same — parse defensively, fail loudly |
| Cross-nation comparability | Document that deciles are only comparable within a nation. Rules are per-nation anyway. |
| Lookup file size growth (+90KB) | Negligible. Still well under 1MB. |
| False confidence boost | Deprivation is additive only. Can never make someone ineligible or lower confidence. |

## Ship order

1. **Build script** — extend to tri-nation, regenerate lookup, run BUILD tests
2. **Lookup tests** — DLOOK-01 to DLOOK-05, verify Welsh + Scottish entries
3. **Eligibility rules** — update 4 rules, run DEP-01 to DEP-12
4. **Regression** — full `npm test` to confirm no existing tests break
5. **Docs** — update eligibility-sources.md, TESTING.md
6. **PR to main**
