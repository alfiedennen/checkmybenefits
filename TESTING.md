# Testing & Evaluation

This document covers the testing methodology, eval suite design, and findings for Check My Benefits.

## Overview

The app has two fundamentally different components that need testing:

1. **Deterministic engine** — eligibility rules, cascade resolution, conflict handling, value estimation. Given the same PersonData, always produces the same bundle. Testable with standard unit tests.
2. **AI extraction** — understanding natural language ("me mum can't cope", "about twelve grand", "council gaff") and extracting structured PersonData. Non-deterministic. Requires eval scenarios run against the live model.

These need different testing strategies. We use four layers.

## Test Layers

| Layer | Count | Runtime | API calls | Runs |
|-------|-------|---------|-----------|------|
| Deterministic tests (Vitest) | 411 | <1s | 0 | Every push |
| Single-turn AI evals | 105 | ~80s | 105 | Weekly + manual |
| Multi-turn AI evals | 16 | ~60s | ~70 | Weekly + manual |
| Guardrail evals | 30 | ~30s | 30 | Manual |

## Layer 1: Deterministic Tests (411 tests)

All run via `npm test` with Vitest. No AI calls, no network, sub-second runtime.

### Entitlement Matrix (146 tests)

**File:** `tests/engine/entitlement-matrix.test.ts`

Programmatically generates PersonData objects and runs them through `buildBundle()` to verify every entitlement is correctly included or excluded across all relevant dimensions.

| Group | Tests | What it verifies |
|-------|-------|-----------------|
| A: Nation filtering | 7 | England-only entitlements excluded from Wales/Scotland bundles and vice versa |
| B: Entitlement inclusion | 76 | Every entitlement appears in a bundle when all qualifying conditions are met |
| C: Entitlement exclusion | 30 | Entitlements excluded when a key criterion is not met |
| D: Boundary/threshold | 11 | Age 65 vs 66 (pension age), carer hours 34 vs 35, capital thresholds |
| E: Conflict resolution | 5 | Mutually exclusive entitlements (UC vs PC, England vs Wales CT support) |
| F: Cascade integrity | 5 | Gateway entitlements correctly unlock cascaded dependents |

**Coverage:** All 75 entitlements are directly tested for both inclusion and exclusion. All 3 nations tested.

### Conversation Replay (12 tests)

**File:** `tests/engine/conversation-replay.test.ts`

Simulates multi-turn conversations using the code extractor only (no AI). Catches extraction gaps that would silently block results in production. These were created after two production bugs where "None" / "Nothing" for income wasn't parsed as zero.

### Persona Scenarios (23 tests)

**File:** `tests/engine/persona-scenarios.test.ts`

End-to-end persona tests: complete PersonData objects through `buildBundle()`, verifying specific entitlements appear and the bundle structure is correct.

### System Prompt Tests (31 tests)

**File:** `tests/services/system-prompt.test.ts`

Verifies the system prompt contains the right guardrails by string-matching against `buildSystemPrompt()` output. Covers: completion gate fields, premature-complete guards, question ordering, scope boundary rules, implicit completion detection.

### Other Unit Tests

- `bundle-builder.test.ts` — core engine logic
- `cascade-resolver.test.ts` — dependency grouping
- `conflict-resolver.test.ts` — mutually exclusive resolution
- `message-extractor.test.ts` — regex/keyword extraction patterns
- `postcodes.test.ts` — full + partial postcode lookup
- `deprivation.test.ts` — tri-nation deprivation decile lookup (England/Wales/Scotland)
- `validate-rates.test.ts` — benefit rate range validation

## Layer 2: Single-Turn AI Evals (105 scenarios)

**Files:** `tests/nova-eval/test-scenarios.ts` + `tests/nova-eval/run-eval.ts`

Each scenario sends a single user message to the production model (Amazon Nova Lite via Bedrock) and scores the AI's extraction against expected PersonData fields.

### Scoring

Each field is scored as: exact match (100%), close match (50–70%), or missing (30% penalty). The combined score uses both the raw AI extraction and the code-based fallback (same as production).

### Categories

| Category | Count | What it tests |
|----------|-------|---------------|
| A: Intake extraction | 6 | Multi-situation, single situations, varying detail levels |
| B: Income band mapping | 5 | "twelve grand", "£25,000", "minimum wage 20hrs", "just JSA" |
| C: Implicit inference | 6 | "my wife" → married, "mortgage" → housing tenure |
| D: Multi-turn state | 5 | Accumulated state across 3-turn flows |
| E: Premature completion | 7 | AI must not complete without required fields |
| F: Edge cases | 4 | Separation, vague input, contradictions, long messages |
| G: Health / disability | 6 | MS, wheelchair+PIP, depression, dementia carer, chronic pain |
| H: Bereavement | 3 | Young widow, elderly widower, carer bereavement |
| I: Separation | 3 | Divorce with kids, DV + no income, joint mortgage |
| J: Mixed / novel | 4 | Homeless + addiction, early retirement, student + baby |
| K: NHS health costs | 6 | Pension Credit → NHS cascade, diabetes + LIS, pregnancy exemption |
| L: Childcare & education | 5 | UC childcare, working parents 30hrs, student parent |
| M: Housing & energy | 4 | Pensioner renting, SMI mortgage, WaterSure, ECO4 |
| N: Transport & legal | 3 | PIP mobility + transport, court fee remission, funeral expenses |
| O: Nation-specific | 8 | Welsh prescriptions, Scottish Child Payment, Young Carer Grant |
| P: Colloquial British English | 5 | "me mum", "on the dole", "missus", "our kid", "500 quid" |
| Q: Vague / ambiguous input | 5 | "struggling to get by", "can't manage", "it's complicated" |
| R: Complex financial | 5 | Pension components, zero hours, monthly UC, redundancy payout |
| S: Complex family / housing | 5 | Sofa surfing, boyfriend moved in, multigenerational, shared custody |
| T: Medical / disability nuance | 5 | Waiting for assessment, cancer remission, long COVID, no diagnosis |
| U: Welsh / Scottish dialect | 5 | "mam", "bairn", "on the sick", "aye", valleys/Dundee context |

### Results

| Metric | Model-only | Model + code fallback |
|--------|-----------|----------------------|
| Overall score | 82.0% | **96.1%** |
| Scenarios passed | 103/105 | **105/105** |
| Avg latency | 750ms | 750ms |
| Est. cost/conversation | ~$0.001 | ~$0.001 |

The code-based extraction fallback (`message-extractor.ts`) catches fields the AI misses — postcodes, ages, income patterns, housing keywords — adding 14 percentage points. This dual-layer approach is a deliberate design choice: use the AI for what it's good at (understanding intent, handling ambiguity), use code for what it's good at (pattern matching, deterministic extraction).

## Layer 3: Multi-Turn AI Evals (16 scenarios)

**Files:** `tests/nova-eval/multi-turn-scenarios.ts` + `tests/nova-eval/run-multi-turn-eval.ts`

Each scenario is a sequence of user messages simulating a real conversation. The eval runner sends each turn to Bedrock, accumulates PersonData (same as production), and verifies:

1. AI does NOT transition to 'complete' before all critical fields are collected
2. After all turns, `hasCriticalFields()` passes
3. `buildBundle()` produces the expected entitlements

### Scoring

Weights: completeness (0.4) + gate pass (0.2) + no premature complete (0.2) + bundle correctness (0.2). Pass threshold: >= 70%.

### Scenarios

| ID | Name | Turns | Key test |
|----|------|-------|----------|
| MT01 | Job loss, evasive income | 5 | AI persists when user says "not much honestly" |
| MT02 | Pensioner, missing housing | 4 | AI asks for housing when user skips it |
| MT03 | Everything in one message | 1 | AI handles info-dense single turn |
| MT04 | No housing → must not complete | 4 | Production bug reproduction |
| MT05 | Carer, gradual reveal | 6 | Accumulates carer data across 6 turns |
| MT06 | Disability, PIP received | 5 | AI recognises existing benefit receipt |
| MT07 | Bereavement, emotional | 5 | AI handles emotion while collecting data |
| MT08 | Student employment | 4 | AI classifies uncommon employment status |
| MT09 | Welsh pensioner | 4 | Nation-specific entitlements (CF10 postcode) |
| MT10 | Scottish family | 4 | Scottish Child Payment + Best Start |
| MT11 | Qualitative age "I'm old" | 5 | AI must ask for numeric age |
| MT12 | Colloquial gradual reveal | 4 | Slang: "missus", "council gaff", "quid" |
| MT13 | Vague-to-specific funnel | 5 | Starts vague, AI must probe for specifics |
| MT14 | Complex financial | 4 | State pension + occupational pension components |
| MT15 | Welsh carer with dialect | 5 | "mam", Swansea, 40hrs caring |
| MT16 | Scottish family, complex | 4 | "bairn", partner redundant, EH1 postcode |

### Results

| Metric | Value |
|--------|-------|
| Passed | **16/16** |
| Average score | **96.2%** |
| Gate failures | 0 |
| Premature completions | 0 |

## Layer 4: Guardrail Evals (30 scenarios)

**File:** `tests/nova-eval/guardrail-eval.ts`

Tests the combination of Bedrock Guardrails (content safety, PII blocking) and system prompt scope rules (off-topic redirection).

- 10 off-topic scenarios (poems, code, CVs, recipes, etc.)
- 20 on-topic scenarios (legitimate benefits queries)

**Critical metric:** Zero false positives (legitimate queries must never be blocked).

## Completion Gate

The system uses a dual-layer gate to prevent premature results:

1. **AI-level gate** — System prompt contains a "COMPLETION GATE — MANDATORY CHECKLIST" requiring 5 fields (age, employment_status, income_band, housing_tenure, postcode) before transitioning to complete.
2. **Code-level gate** — `critical-fields.ts` blocks the `complete` transition if any field is missing, regardless of what the AI says.
3. **Implicit completion detection** — `looksLikeCompletion()` catches cases where the AI writes completion text without the XML tag, triggering the gate check anyway.

The code gate is the real safety net. AI non-determinism means the prompt-level gate is necessary but not sufficient.

## Code Extraction Fallback

`message-extractor.ts` provides deterministic regex/keyword extraction that runs alongside AI extraction. It catches:

- Postcodes (full and partial)
- Ages ("I'm 35", "aged 78")
- Income patterns ("twelve grand", "£25,000", "minimum wage", "just my pension", "nothing/none/zero")
- Housing keywords ("council flat" → rent_social, "mortgage", "own outright")
- Relationship markers ("my wife" → couple_married, "my partner" → couple_cohabiting)
- Employment status ("lost my job" → unemployed, "retired", "student", "self-employed")
- Carer patterns ("40 hours a week looking after")
- Disability/PIP references

This layer adds ~14 percentage points to overall accuracy and catches the long tail of extraction failures.

## Findings

### What the AI handles well
- Situation classification (lost_job, new_baby, bereavement, ageing_parent)
- Emotional context (bereavement, disability) without losing data collection focus
- Dense single-turn input with multiple data points
- Conversation management (asking follow-ups, not completing early)

### What the code fallback catches
- Colloquial income ("twelve grand", "about 45k", "minimum wage")
- Implicit housing ("council flat" → rent_social, "mortgage")
- Implicit relationships ("my wife" → couple_married)
- Zero income ("nothing", "none", "£0")
- Postcodes (AI sometimes omits from XML but mentions in text)

### Known limitations
- "morgage" (typo) not caught by code extractor — AI handles it
- Colloquial slang scores lower (75-85%) but still passes with code fallback
- Vague input ("struggling to get by") scores lowest — by design, as there's genuinely less to extract
- child_benefit sometimes missing from multi-turn bundles when the AI doesn't explicitly identify children in the `new_baby` situation — the entitlement still appears if children are properly extracted

## Running Evals

```bash
# Deterministic tests (no API calls)
npm test

# AI evals (requires AWS credentials with Bedrock access)
npm run eval              # 105 single-turn scenarios
npm run eval:multi-turn   # 16 multi-turn scenarios
npm run eval:guardrail    # 30 guardrail scenarios
```

Results are saved to `tests/nova-eval/results.json` and `tests/nova-eval/multi-turn-results.json`.

## CI Integration

```
Every push (vitest, 411 tests, <1s):
  ├── unit tests (engine, extraction, postcodes, rates)
  ├── entitlement-matrix.test.ts     (134 matrix tests, all 75 entitlements × 3 nations)
  ├── conversation-replay.test.ts    (12 replay scenarios)
  └── system-prompt.test.ts          (31 guardrail tests)

Weekly (eval.yml, Bedrock API):
  ├── run-eval.ts                    (105 single-turn scenarios)
  └── run-multi-turn-eval.ts         (16 multi-turn scenarios)
```
