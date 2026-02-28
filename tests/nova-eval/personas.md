# Multi-Turn Eval Personas

23 personas used in `multi-turn-scenarios.ts`. Each simulates a real conversation
with the Check My Benefits chat, testing AI extraction, gate enforcement, and
bundle correctness.

Run: `npm run eval:multi-turn`

## Persona Index

| ID | Name | Age | Nation | Situation | Turns | Key Test |
|----|------|-----|--------|-----------|-------|----------|
| MT01 | Job loss, evasive income | 35 | England | lost_job | 5 | AI persists when user is vague about income |
| MT02 | Pensioner, missing housing | 78 | England | — | 4 | AI must ask for housing before completing |
| MT03 | Dense single message | 30 | England | new_baby | 1 | AI extracts everything from one rich message |
| MT04 | No housing early | 28 | England | lost_job | 4 | AI must NOT complete without housing_tenure |
| MT05 | Carer, gradual reveal | 48 | England | ageing_parent | 6 | Caring hours + income extracted over 6 turns |
| MT06 | Disability with PIP | 42 | England | health_condition | 5 | AI recognises existing PIP, sets correct level |
| MT07 | Bereavement | 68 | England | bereavement | 5 | Sensitivity + data collection under emotion |
| MT08 | Student, pregnant | 22 | England | new_baby | 4 | Uncommon employment status (student) |
| MT09 | Welsh pensioner | 75 | Wales | — | 4 | Wales nation filtering + Welsh entitlements |
| MT10 | Scottish family, new baby | 32 | Scotland | new_baby | 4 | Scottish Child Payment + Best Start |
| MT11 | Qualitative age | 79 | England | — | 5 | "I'm old" must prompt for numeric age |
| MT12 | Colloquial language | 29 | England | new_baby | 4 | Slang extraction ("missus", "council gaff", "12 grand") |
| MT13 | Vague-to-specific funnel | 45 | England | lost_job | 5 | AI probes when opener gives no data |
| MT14 | Complex financial | 72 | England | — | 4 | Multiple pension components summed correctly |
| MT15 | Welsh carer with dialect | 50 | Wales | ageing_parent | 5 | "mam" + Wales nation + carer entitlements |
| MT16 | Scottish family, redundant partner | 30 | Scotland | new_baby, lost_job | 4 | Dual situation + Scottish entitlements |
| MT17 | Self-employed parent, own autism/ADHD | 34 | England | health_condition | 6 | Disability attributed to USER not child |
| MT18 | Domestic abuse, fleeing | 31 | England | domestic_abuse | 5 | Sensitivity + separated status + living_with_family |
| MT19 | Working poverty, couple | 35 | England | — | 5 | In-work benefits, most common UC profile |
| MT20 | Young NEET care leaver | 18 | England | — | 4 | Youth homelessness, minimal persona |
| MT21 | Homeless rough sleeper | 40 | England | — | 4 | No fixed address, partial postcode only |
| MT22 | England single renter | 28 | England | lost_job | 4 | CTR enrichment with precise Manchester postcode |
| MT23 | Welsh single parent | 30 | Wales | — | 4 | CTR Wales variant with Swansea postcode |

## Detailed Personas

### MT01: Job loss, evasive income

**Profile:** 35, single, unemployed, zero income, renting privately, London E1.

**What it tests:** User gives vague answers about income ("not much honestly").
AI must persist and extract zero income correctly, not skip the field.

**Key entitlements:** universal_credit, council_tax_support_working_age
**Expected bundle size:** 12+ (full low-income England package)

---

### MT02: Pensioner, missing housing

**Profile:** 78, retired, single, ~£9k pension income, owns outright, Birmingham B15.

**What it tests:** User provides age/income/postcode but forgets housing. AI must
ask for housing_tenure before completing — the gate requires it.

**Key entitlements:** pension_credit, winter_fuel_payment
**Expected bundle size:** 15+ (pension-age package with NHS/energy/council tax)

---

### MT03: Dense single message

**Profile:** 30, married, part-time employed, ~£14k, council flat, new baby, Leeds LS1.

**What it tests:** User front-loads everything in one message. AI must extract all
fields in a single turn and potentially complete immediately.

**Key entitlements:** child_benefit
**Expected bundle size:** 14+ (low-income family with baby)

---

### MT04: No housing provided early

**Profile:** 28, single, unemployed, zero income, renting privately, London E1.

**What it tests:** User gives postcode before housing — gate must block completion
until housing_tenure is provided.

**Key entitlements:** universal_credit
**Expected bundle size:** 12+ (same as MT01)

---

### MT05: Carer, gradual reveal

**Profile:** 48, single, full-time carer for mum (82), 40hrs/wk, zero income,
council house, Newcastle NE1.

**What it tests:** Information revealed slowly over 6 turns. AI must accumulate
caring hours, employment status, and income without re-asking.

**Key entitlements:** carers_allowance, universal_credit
**Expected bundle size:** 16+ (carer + low-income + parent's entitlements)

---

### MT06: Disability with PIP

**Profile:** 42, single, MS diagnosis, PIP enhanced mobility, unemployed, zero
income, renting privately, Manchester M1.

**What it tests:** AI must recognise existing disability benefit (PIP enhanced
mobility) and set the correct level. Bundle should include motability and vehicle
tax exemption.

**Key entitlements:** universal_credit, motability_scheme, vehicle_excise_duty_exemption
**Expected bundle size:** 17+ (disability + low-income package)

---

### MT07: Bereavement

**Profile:** 68, retired, widowed (husband died last month), ~£8k pension income,
owns home outright, Newcastle NE1.

**What it tests:** AI handles emotional context while still collecting data
methodically. Must set is_bereaved, deceased_relationship, and not rush to completion.

**Key entitlements:** pension_credit, winter_fuel_payment
**Expected bundle size:** 15+ (pension-age package + bereavement support)

---

### MT08: Student, pregnant

**Profile:** 22, student, pregnant with first child, partner earns ~£18k, renting
privately, Leicester LE1.

**What it tests:** Uncommon employment_status (student). Students are NOT eligible
for UC but ARE eligible for student-specific entitlements.

**Key entitlements:** child_benefit, student_maintenance_loan
**Expected bundle size:** 10+ (student + pregnancy entitlements)

---

### MT09: Welsh pensioner

**Profile:** 75, retired, single, ~£9k pension, owns outright, Cardiff CF10.

**What it tests:** Wales nation filtering. Should get Welsh-specific entitlements
(council_tax_reduction_wales, welsh_government_fuel_support) and Wales-wide
free prescriptions. England-only entitlements must be excluded.

**Key entitlements:** pension_credit, free_nhs_prescriptions, council_tax_reduction_wales
**Expected bundle size:** 15+ (pension-age + Wales-specific)

---

### MT10: Scottish family, new baby

**Profile:** 32, unemployed, partner works part-time ~£10k, new baby (2 months),
council house, Edinburgh EH1.

**What it tests:** Scottish-specific entitlements for families with young children.
Scottish Child Payment, Best Start Grant/Foods should all appear.

**Key entitlements:** child_benefit, scottish_child_payment, best_start_grant
**Expected bundle size:** 19+ (Scotland family package)

---

### MT11: Qualitative age ("I'm old")

**Profile:** 79, retired, single, ~£11k pension, council house, Birmingham B15.

**What it tests:** User says "I'm old" — AI must ask for a numeric age. Cannot
default or guess. "I can't manage on my own" may trigger daily living needs.

**Key entitlements:** pension_credit, winter_fuel_payment
**Expected bundle size:** 16+ (pension-age + renting)

---

### MT12: Colloquial language

**Profile:** 29, unemployed, cohabiting ("the missus"), new baby, ~£12k (partner's
wages), council house ("council gaff"), Bradford BD1.

**What it tests:** Slang and informal language extraction. "12 grand", "council
gaff", "500 quid", "the missus" must all map to correct PersonData fields.

**Key entitlements:** child_benefit, universal_credit
**Expected bundle size:** 14+ (low-income family with baby)

---

### MT13: Vague-to-specific funnel

**Profile:** 45, single, unemployed (3 weeks), zero income, no savings, renting
privately, Leeds LS1.

**What it tests:** User opens with "things are really bad" — no extractable data.
AI must probe without being pushy.

**Key entitlements:** universal_credit, council_tax_support_working_age
**Expected bundle size:** 12+ (same as MT01)

---

### MT14: Complex financial (pension components)

**Profile:** 72, retired, single, ~£14k combined pensions (state + works), owns
outright, Newcastle NE1.

**What it tests:** User has multiple income sources that need summing. At ~£14k the
income is near the Pension Credit threshold (~£11.8k for single), so PC may show
as 'possible' but not 'likely'.

**Key entitlements:** winter_fuel_payment
**Expected bundle size:** 15+ (pension-age package, borderline for PC)

---

### MT15: Welsh carer with dialect

**Profile:** 50, single, carer for mam (83), 40hrs/wk, unemployed, zero income,
renting privately, Swansea SA1.

**What it tests:** Welsh dialect ("mam") + Wales nation filtering + carer
entitlements. Should get Welsh-specific benefits alongside UK-wide carer support.

**Key entitlements:** carers_allowance, universal_credit
**Expected bundle size:** 16+ (carer + Wales-specific)

---

### MT16: Scottish family, redundant partner

**Profile:** 30, employed part-time ~£10k, partner redundant, second baby,
council house, Edinburgh EH1.

**What it tests:** Dual situation (new_baby + lost_job). Partner's redundancy
means household income has dropped. Scottish entitlements should appear.

**Key entitlements:** child_benefit, scottish_child_payment, universal_credit
**Expected bundle size:** 19+ (Scotland family package)

---

### MT17: Self-employed parent, own autism/ADHD

**Profile:** 34, self-employed, single parent, daughter age 6, autism + ADHD
(USER's own condition), ~£8k income, renting privately, Leeds LS9.

**What it tests:** The exact bug from Feb 2026 user report. AI was assuming
autism/ADHD belonged to the child. Must attribute disability to the USER
(has_disability_or_health_condition: true), not the child (has_additional_needs).
Turn 2 is an explicit correction.

**Key entitlements:** universal_credit, child_benefit
**Expected bundle size:** 18+ (disability + child + low-income)

---

### MT18: Domestic abuse, fleeing with children

**Profile:** 31, separated (fleeing abusive partner), 2 children (ages 3, 7),
never worked, zero income, staying at mum's house, Manchester M14.

**What it tests:** Sensitivity handling for domestic abuse. Housing_tenure is
living_with_family (temporary). AI must not make assumptions about returning
to the partner or probe for details about the abuse.

**Key entitlements:** universal_credit, child_benefit
**Expected bundle size:** 16+ (low-income family with young children)

---

### MT19: Working poverty, couple both employed

**Profile:** 35, married, both working (user full-time min wage, wife 16hrs),
combined ~£28k, 2 children (ages 4, 10), renting privately, Bradford BD1.

**What it tests:** The most common UC claimant profile nationally — working
household that still can't make ends meet. Income is above most low-income
thresholds but below higher-rate thresholds. Bundle will be smaller than
unemployed personas.

**Key entitlements:** child_benefit, free_childcare_15hrs_universal
**Expected bundle size:** 8+ (in-work benefits, childcare, marriage allowance)

---

### MT20: Young NEET care leaver

**Profile:** 18, single, left care system, unemployed, zero income, sofa surfing
at friend's house, London SE1.

**What it tests:** Youth homelessness. Housing_tenure maps to "homeless".
Minimal persona with no children, no disability, no dependents. Tests that
the system still produces a meaningful bundle for the most vulnerable young people.

**Key entitlements:** universal_credit
**Expected bundle size:** 12+ (low-income England package, NHS, energy, broadband)

---

### MT21: Homeless rough sleeper

**Profile:** 40, single, unemployed, zero income, sleeping rough in Birmingham,
no fixed address. Provides partial postcode only (B5).

**What it tests:** Hardest edge case — no full postcode (partial only), no
housing cost, no settled accommodation. Tests partial postcode handling and
that the system doesn't break when housing_tenure is "homeless".

**Key entitlements:** universal_credit
**Expected bundle size:** 12+ (low-income package, though some may be hard to access without address)

---

### MT22: England single renter — CTR enrichment

**Profile:** 28, single, unemployed (just made redundant), zero income, renting
privately £650/month, Manchester M1 1AE.

**What it tests:** CTR enrichment with a precise England postcode. When the
MissingBenefit API is available, the bundle should contain a precise
council_tax_support_working_age value instead of a heuristic range. Tests the
full enrichment path for the most common CTR scenario (working-age, low income,
renting).

**Key entitlements:** universal_credit, council_tax_support_working_age
**Expected bundle size:** 5+

---

### MT23: Welsh single parent — CTR Wales variant

**Profile:** 30, single parent (4-year-old daughter), employed part-time
~£8,000/year, renting privately £500/month, Swansea SA1 1DP.

**What it tests:** CTR Wales variant enrichment. Verifies that
council_tax_reduction_wales appears in the bundle with correct nation filtering.
Also tests single parent extraction and part-time employment classification.

**Key entitlements:** child_benefit, council_tax_reduction_wales
**Expected bundle size:** 4+

---

## Coverage Matrix

| Dimension | Scenarios |
|-----------|-----------|
| **Employment** | |
| Unemployed / job loss | MT01, MT04, MT05, MT13, MT17, MT18, MT20, MT21, MT22 |
| Self-employed | MT17 |
| Employed (in-work) | MT03, MT19 |
| Retired / pensioner | MT02, MT07, MT09, MT11, MT14 |
| Student | MT08 |
| Full-time carer | MT05, MT15 |
| **Household** | |
| Single, no children | MT01, MT02, MT04, MT11, MT13, MT14, MT20, MT21, MT22 |
| Single parent | MT17, MT18, MT23 |
| Couple, no children | MT07 |
| Couple with children | MT03, MT10, MT12, MT16, MT19 |
| **Age** | |
| 18-25 (youth) | MT08, MT20 |
| 25-50 (working age) | MT01, MT03, MT04, MT05, MT12, MT13, MT15, MT16, MT17, MT18, MT19, MT21, MT22, MT23 |
| 50-65 (older working age) | MT15 |
| 66+ (pension age) | MT02, MT07, MT09, MT11, MT14 |
| **Nation** | |
| England | MT01-MT08, MT11-MT14, MT17-MT22 |
| Wales | MT09, MT15, MT23 |
| Scotland | MT10, MT16 |
| **Situation** | |
| Job loss / redundancy | MT01, MT04, MT13, MT16, MT22 |
| New baby | MT03, MT08, MT10, MT12, MT16 |
| Ageing parent / carer | MT05, MT15 |
| Disability / health | MT06, MT17 |
| Bereavement | MT07 |
| Domestic abuse | MT18 |
| Working poverty | MT19 |
| Homelessness | MT20, MT21 |
| **Special extraction** | |
| Vague / evasive answers | MT01, MT13 |
| Colloquial / slang | MT12, MT15 |
| Dense single message | MT03 |
| Qualitative age | MT11 |
| Partial postcode | MT21 |
| Disability self-disclosure | MT17 |
| Existing benefit (PIP) | MT06 |
| Complex income | MT14 |
| CTR enrichment target | MT22, MT23 |

## Gaps and Future Personas

Not yet covered:
- **Northern Ireland** — unique welfare system, legacy benefits
- **Couple where one partner is disabled** — disability premium on UC
- **Separated parent, shared custody** — who claims child benefit?
- **Immigrant / refugee** — recourse to public funds
- **Already on legacy benefits** — should they switch to UC?
- **Long-term sick (ESA)** — existing legacy benefit holder
- **Grandparent kinship carer** — raising grandchild, not parent
