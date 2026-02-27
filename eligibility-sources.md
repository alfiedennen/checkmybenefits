# Where Our Eligibility Criteria Come From

## Overview

Every eligibility rule in Check My Benefits is derived from officially published government criteria. We use **public APIs and open data only** — no private integrations, no scraping behind authentication.

---

## 1. Benefit Rates

**Source:** [GOV.UK Benefit and Pension Rates 2025-26](https://www.gov.uk/government/publications/benefit-and-pension-rates-2025-to-2026/benefit-and-pension-rates-2025-to-2026)

Income thresholds, weekly payment amounts, and capital limits are fetched from individual GOV.UK benefit pages via the **GOV.UK Content API** (`https://www.gov.uk/api/content/...`). Each rate links back to its official source:

| Benefit | Source Page |
|---------|-----------|
| Attendance Allowance | [gov.uk/attendance-allowance/what-youll-get](https://www.gov.uk/attendance-allowance/what-youll-get) |
| Pension Credit | [gov.uk/pension-credit/what-youll-get](https://www.gov.uk/pension-credit/what-youll-get) |
| Carer's Allowance | [gov.uk/carers-allowance/how-much-youll-get](https://www.gov.uk/carers-allowance/how-much-youll-get) |
| Child Benefit | [gov.uk/child-benefit/what-youll-get](https://www.gov.uk/child-benefit/what-youll-get) |
| Universal Credit | [entitledto.co.uk/help/universal-credit-rates](https://www.entitledto.co.uk/help/universal-credit-rates) |
| PIP | [gov.uk/pip/how-much-youll-get](https://www.gov.uk/pip/how-much-youll-get) |
| Marriage Allowance | [gov.uk/marriage-allowance](https://www.gov.uk/marriage-allowance) |
| Maternity Allowance | [gov.uk/maternity-allowance/what-youll-get](https://www.gov.uk/maternity-allowance/what-youll-get) |
| Bereavement Support Payment | [gov.uk/bereavement-support-payment/what-youll-get](https://www.gov.uk/bereavement-support-payment/what-youll-get) |
| Warm Home Discount | [gov.uk/the-warm-home-discount-scheme](https://www.gov.uk/the-warm-home-discount-scheme) |
| Healthy Start | [healthystart.nhs.uk](https://www.healthystart.nhs.uk) |
| Free School Meals | [gov.uk/apply-free-school-meals](https://www.gov.uk/apply-free-school-meals) |

**Update mechanism:** Rates are auto-fetched weekly from the GOV.UK Content API, parsed with `cheerio` (HTML table extraction), and validated against expected ranges before updating. A daily monitor watches the [DWP publications Atom feed](https://www.gov.uk/search/all.atom?keywords=benefit+pension+rates&organisations%5B%5D=department-for-work-pensions) for new rate announcements.

**Current data:** Tax year 2025-26, last updated 2025-04-06.

---

## 2. Eligibility Rules

Each of the 48 eligibility rules is a code translation of the criteria published on GOV.UK, Welsh Government, or Scottish Government pages. The rules check fields like age, income, employment status, housing tenure, disability, and caring responsibilities against official thresholds.

**How rules are derived:**
1. Read the official "Eligibility" or "Who can get it" page for the benefit
2. Identify the criteria (age, income, capital, circumstances)
3. Translate into a deterministic code check against the user's `PersonData`
4. Cross-reference against independent sources (entitledto.co.uk, Citizens Advice factsheets, Disability Rights UK)

**What the rules reference:**
- State Pension Age thresholds
- Weekly/annual income limits from `benefit-rates.json`
- Capital limits (e.g. UC: £6k lower, £16k upper)
- Carer's Allowance 35-hour rule and qualifying benefits list
- PIP/DLA component levels for passported benefits
- Age bands (e.g. PIP: 16 to SPA; prescriptions: 60+)

**Confidence tiers** reflect how certain we can be:
- **Likely** — core criteria clearly met
- **Possible** — some criteria met, others uncertain (e.g. disability benefits requiring professional assessment)
- **Worth checking** — can't assess from available info

---

## 3. Entitlement Definitions

The 75 entitlements in `entitlements.json` each link to their official application page:

- **GOV.UK** (DWP/HMRC benefits): `gov.uk/[benefit]/how-to-claim`
- **NHS**: `nhs.uk/nhs-services/help-with-health-costs/...`
- **Welsh Government**: `gov.wales/[scheme-name]`
- **Scottish Government**: `mygov.scot/[scheme-name]`
- **Council Tax Support**: no national URL — varies by council (300+ local schemes)

Each entitlement also carries:
- Administrative body (DWP, HMRC, NHS, local council, etc.)
- Claiming difficulty rating (automatic → adversarial)
- Gateway dependencies (which benefits unlock others)
- Conflict edges (mutually exclusive pairs)
- Nation availability (England, Wales, Scotland)

---

## 4. Area Deprivation Data

We use deprivation indices to boost eligibility confidence for area-based schemes (ECO4 home insulation, Warm Home Discount, Flying Start Wales, disadvantaged childcare). Deprivation is derived from the user's postcode — no extra questions needed.

| Nation | Dataset | Geography | Source | Entries |
|--------|---------|-----------|--------|---------|
| England | IMD 2019 | LSOA (`E01...`) | [GOV.UK](https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019) | 32,066 |
| Wales | WIMD 2025 | LSOA (`W01...`) | [GOV.WALES](https://www.gov.wales/welsh-index-multiple-deprivation-2025) | 1,917 |
| Scotland | SIMD 2020v2 | Data zone (`S01...`) | [gov.scot](https://www.gov.scot/collections/scottish-index-of-multiple-deprivation-2020/) | 6,976 |

All three use a 1–10 decile scale (1 = most deprived). Deciles 1–3 (bottom 30%) are treated as "deprived" for eligibility purposes. The indices are not directly comparable across nations, but within each nation the decile ranking is meaningful — which matches how the schemes themselves define eligibility.

Postcode → LSOA/data zone mapping uses [postcodes.io](https://postcodes.io) (public, no auth). Partial postcodes return no LSOA, so deprivation checks are skipped gracefully — no impact on results.

---

## 5. What We Can't Source

Some areas are acknowledged as beyond what we can reliably cover:

- **Council Tax Support** — 300+ different local schemes across England, no national standard
- **Disability benefit assessments** — PIP, AA, DLA eligibility ultimately depends on professional assessment, not just stated criteria
- **Discretionary awards** — local welfare assistance, DHPs, etc. are at council discretion
- **Immigration status interactions** — legally complex, out of scope
- **Complex self-employment** — income treatment varies by benefit

For these, confidence is capped at `possible` or `worth_checking` and users are directed to professional advisers.

---

## 6. Verification Process

From `accuracy-and-liability.md`:

1. Check GOV.UK for updated rates
2. Cross-reference against independent source (entitledto.co.uk, Citizens Advice, Disability Rights UK)
3. Update JSON data model
4. Update `last_verified` dates
5. Run test scenarios to verify changed rates produce sensible results
6. If rate changes >10%, review knock-on effects on cascaded entitlements

**Update calendar:**
- **April** — Annual benefit uprating (DWP/HMRC rates)
- **November (typically)** — Budget/Autumn Statement changes
- **April (usually)** — Local council scheme changes
- **As announced** — Ad hoc policy changes

---

## 7. Language We Use (and Don't)

| We say | We never say |
|--------|-------------|
| "You may be entitled to..." | "You are entitled to..." |
| "This is worth checking" | "You should claim this" |
| "Estimated value: up to £X/year" | "You will receive £X" |
| "Based on what you've told us" | "We've confirmed your eligibility" |

---

## Summary

| Data | Source | Update Frequency |
|------|--------|-----------------|
| Benefit rates & thresholds | GOV.UK Content API | Weekly (automated) |
| Eligibility rules | GOV.UK / Welsh Govt / Scottish Govt pages | Per release (manual) |
| Application URLs | GOV.UK, NHS, devolved govt sites | Per release (manual) |
| Rate change alerts | DWP Atom feed | Daily (automated) |
| Area deprivation | IMD 2019 / WIMD 2025 / SIMD 2020v2 | Static (rebuilt per release) |
| Postcode lookup | postcodes.io | Real-time API |

All source code — including every rule — is open on [GitHub](https://github.com/alfiedennen/checkmybenefits).
