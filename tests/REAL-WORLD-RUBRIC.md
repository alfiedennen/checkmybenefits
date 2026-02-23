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

### Layer 2: Multi-Turn AI Evals (implemented, run 3x)

Scoring weights: completeness (0.4) + gate pass (0.2) + no premature complete (0.2) + bundle correctness (0.2). Pass threshold: >= 75%.

| ID | Name | Best score | Status | Key test |
|----|------|-----------|--------|----------|
| MT01 | Job loss, evasive income | 100% | PASS | AI persists when user says "not much honestly" |
| MT02 | Pensioner, missing housing | 100% | PASS | AI asks for housing when user skips it |
| MT03 | Everything in one message | 93% | PASS | AI handles info-dense single turn |
| MT04 | No housing → must not complete | 100% | PASS | Direct reproduction of bug 1 |
| MT05 | Carer, gradual reveal | 100% | PASS | Accumulates carer data across 6 turns |
| MT06 | Disability, PIP received | 100% | PASS | AI recognises existing benefit receipt |
| MT07 | Bereavement, emotional context | 96% | PASS | AI handles emotion while collecting data |
| MT08 | Student employment type | 100% | PASS | AI correctly classifies uncommon status |

**MT07 fix:** Previously failed (53-74%) because the AI didn't extract "housewife" → employment_status or "eight thousand" → income. Adding code extractor patterns for these phrases made it deterministic (96%). Remaining 4% gap: code maps "housewife" → `unemployed` vs expected `retired`.

### Layer 3: System Prompt Tests (implemented, every push)

**File:** `tests/services/system-prompt.test.ts`

20 deterministic tests that verify the system prompt contains the right guardrails. No AI calls — just string matching against `buildSystemPrompt()` output.

| Category | Count | What it checks |
|----------|-------|---------------|
| Gate field alignment | 4 | All 4 gate fields present, completion prohibition, postcode in gate section |
| Premature completion guards | 4 | Postcode warning, checklist, no fabrication, partial postcode acceptance |
| Current context injection | 4 | Collected fields shown, missing fields visible, situations included, no re-asking |
| Stage instructions | 4 | Intake extracts everything, questions one-at-a-time, complete focuses on results, bereavement sensitivity |
| Regression: MT07 bereavement | 2 | Missing postcode still required, sensitivity doesn't override gate |
| Regression: MT05 carer | 1 | Missing postcode after housing still required |
| Regression: MT03 child_benefit | 1 | Children array includes existing children |

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

These gaps were found by writing the replay tests and analysing multi-turn eval failures:

| Gap | Fix | Scenario |
|-----|-----|----------|
| "none"/"nothing" not parsed as £0 | Added zero-income patterns | R01, R05 |
| "£0" not matched (regex \b before £) | Fixed regex boundary | R11 |
| "can't work" not → unemployed | Added employment pattern | R06 |
| "give up work" not → unemployed | Added employment pattern | R05 |
| "let go" not → unemployed | Added employment pattern | R06 |
| "I'm a student" not → student | Added student pattern | R09 |
| "helps me with everything" not → daily living | Fixed regex to allow "helps me with" | R03 |
| "housewife"/"homemaker"/"stay at home mum" | Added → unemployed | MT07 |
| "eight thousand"/"ten thousand" (word amounts) | Extended word patterns (5k-50k) | MT07 |
| "we own our home" (no "outright") | Added own_outright pattern | common |
| "self-employed" / "self employed" | Added → self_employed | common |
| "state pension" / "on a pension" | Added → retired | common |
| "divorced" / "going through a divorce" | Added → separated | common |

## Known Remaining Gaps

| Gap | Impact | Mitigation |
|-----|--------|-----------|
| "morgage" (typo) not caught | housing_tenure missing → gate fails | AI layer handles common typos |
| "minimum wage" not parsed as income | income_band missing | AI layer extracts this |
| "not much" / vague income | income_band missing | AI should ask follow-up (MT01 will test) |
| Bereavement overrides relationship | "husband died" → couple_married then widowed | AI handles correct ordering |

## CI Integration

```
Every push (vitest, 230 tests, ~7s):
  ├── existing unit + persona tests
  ├── conversation-replay.test.ts  (12 replay scenarios)
  ├── system-prompt.test.ts        (20 guardrail tests)
  └── postcodes.test.ts            (18 tests incl. outcode/partial)

Weekly (Bedrock eval, eval.yml):
  ├── run-eval.ts                  (61 single-turn scenarios)
  └── run-multi-turn-eval.ts       (8 multi-turn scenarios)
```

## Partial Postcode Support

Added in V0.9.1. If a user provides only the outcode (e.g., "SE1", "SW1A"), the system:

1. Routes to postcodes.io `/outcodes/:outcode` API (returns country + admin_district but NOT lsoa/region)
2. Sets `postcode_partial: true` on PersonData
3. Passes the critical fields gate (postcode is populated)
4. UI displays a note: "Results based on a partial postcode"

No eligibility rules currently use nation/lsoa/deprivation, so partial postcodes have zero impact on results. This may change when devolved nation coverage is added.
