# Real-World Rubric: End-to-End Conversation Testing

## Context

Two bugs hit production (Feb 2026) because nothing tested the full loop: messy user input → extraction → PersonData accumulation → critical fields gate → bundle build. The AI conversation and eligibility engine were tested separately (61 evals + 10 persona tests) but the seam between them — where real users type "None" for income or skip housing questions — was untested.

## Test Layers

### Layer 1: Conversation Replay Tests (deterministic, every push)

**File:** `tests/engine/conversation-replay.test.ts`

Simulates multi-turn conversations using only the code extractor. No Bedrock calls. Runs in <1s. Catches extraction gaps that would silently block results in production.

### Layer 2: Multi-Turn AI Evals (Bedrock, weekly)

**Files:** `tests/nova-eval/multi-turn-scenarios.ts` + `tests/nova-eval/run-multi-turn-eval.ts`

Tests AI conversation management — does it collect all 4 required fields before transitioning to complete?

## Scenario Status

### Layer 1: Conversation Replay (implemented)

| ID | Name | Status | Key test |
|----|------|--------|----------|
| R01 | Job loss, single, renting | PASS | "None I lost my job" → zero income (BUG REPRO) |
| R02 | Job loss, couple + kids, mortgage | PASS | "12 grand", combined answers, "my wife" |
| R03 | Pensioner with care needs | PASS | "helps me with everything", retirement |
| R04 | Young family, new baby | PASS | "about 15k", "council flat" |
| R05 | Carer for parent | PASS | "Nothing" → zero income, 40hrs/week |
| R06 | Disability, MS, on PIP | PASS | "Zero income", "can't work", PIP extraction |
| R07 | Bereavement, widowed pensioner | PASS | "husband died", bereavement + relationship |
| R08 | Separated with kids | PASS | "fifteen grand" word-based income |
| R09 | Student with baby | PASS | Student employment extraction |
| R10 | Complex multi-situation | PASS | Job loss + carer + kids + autism |
| R11 | Zero income edge case | PASS | "£0" as standalone input |
| R12 | Typos and lowercase | PASS | "morgage" documents gap, lowercase postcode |

### Layer 2: Multi-Turn AI Evals (implemented, pending first run)

| ID | Name | Status | Key test |
|----|------|--------|----------|
| MT01 | Job loss, evasive income | READY | AI persists when user says "not much honestly" |
| MT02 | Pensioner, missing housing | READY | AI asks for housing when user skips it |
| MT03 | Everything in one message | READY | AI handles info-dense single turn |
| MT04 | No housing → must not complete | READY | Direct reproduction of bug 1 |
| MT05 | Carer, gradual reveal | READY | Accumulates carer data across 6 turns |
| MT06 | Disability, PIP received | READY | AI recognises existing benefit receipt |
| MT07 | Bereavement, emotional context | READY | AI handles emotion while collecting data |
| MT08 | Student employment type | READY | AI correctly classifies uncommon status |

## Failure Mode Coverage

| Failure mode | Replay (R) | AI Eval (MT) |
|---|---|---|
| "none"/"nothing" as zero income | R01, R05 | MT01 |
| "zero"/"£0" as zero income | R06, R11 | — |
| Informal amounts ("12 grand", "fifteen grand") | R02, R08 | — |
| Combined answers in one message | R02, R08, R10 | MT03 |
| Typos ("morgage") | R12 (documented gap) | — |
| Lowercase postcode | R12 | — |
| Implicit relationship ("my wife") | R02, R03, R10 | — |
| Missing housing → no premature complete | — | MT04 |
| Vague/evasive income | — | MT01 |
| Student employment | R09 | MT08 |
| "can't work"/"give up work"/"let go" | R05, R06 | — |
| "helps me with everything" → daily living | R03 | — |
| Multi-turn PersonData accumulation | All R | All MT |
| hasCriticalFields gate | All R | All MT |

## Code Extractor Gaps Fixed

These gaps were found by writing the replay tests:

| Gap | Fix | Scenario |
|-----|-----|----------|
| "none"/"nothing" not parsed as £0 | Added zero-income patterns | R01, R05 |
| "£0" not matched (regex \b before £) | Fixed regex boundary | R11 |
| "can't work" not → unemployed | Added employment pattern | R06 |
| "give up work" not → unemployed | Added employment pattern | R05 |
| "let go" not → unemployed | Added employment pattern | R06 |
| "I'm a student" not → student | Added student pattern | R09 |
| "helps me with everything" not → daily living | Fixed regex to allow "helps me with" | R03 |

## Known Remaining Gaps

| Gap | Impact | Mitigation |
|-----|--------|-----------|
| "morgage" (typo) not caught | housing_tenure missing → gate fails | AI layer handles common typos |
| "minimum wage" not parsed as income | income_band missing | AI layer extracts this |
| "not much" / vague income | income_band missing | AI should ask follow-up (MT01 will test) |
| Bereavement overrides relationship | "husband died" → couple_married then widowed | AI handles correct ordering |

## CI Integration

```
Every push (vitest, ~2s):
  ├── existing unit + persona tests
  └── conversation-replay.test.ts  (12 replay scenarios)

Weekly (Bedrock eval):
  ├── run-eval.ts                  (61 single-turn scenarios)
  └── run-multi-turn-eval.ts       (8 multi-turn scenarios)
```
