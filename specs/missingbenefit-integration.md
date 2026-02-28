# MissingBenefit MCP Integration — CTR Experimental Page

## Context

Check My Benefits currently shows Council Tax Reduction as `possible` for all qualifying users because there are 300+ different local authority schemes across England. We can't assess confidence beyond that with our own data.

Tom's [MissingBenefit](https://missingbenefit.com) API has modelled 293 English billing authorities with per-council scheme data (model type, max reduction %, capital limits, band caps, source URLs) and confidence scores ranging from 60–95%.

This spec covers integrating MissingBenefit's `calculate-benefits` tool as an **experimental page** — a standalone route (`/experiment/council-tax`) not linked from the frontend, used for internal validation before deciding whether to integrate into the product.

---

## What MissingBenefit Provides for CTR

From a single `calculate-benefits` call with `skipDataCheck: true`, we get:

| Field | Example |
|-------|---------|
| `councilName` | "Waltham Forest" |
| `annualAmount` | 1543.11 |
| `confidenceScore` | 95 |
| `confidenceLabel` | "High" |
| `breakdown[]` | Band D rate, single person discount, means-tested reduction, combined saving |
| `applyUrl` | Council-specific application page |
| `notes[]` | Scheme type (banded/taper), data confidence note |

Also returns calculations for UC, State Pension, Pension Credit, PIP, JSA, Housing Benefit, Winter Fuel Payment, Warm Home Discount — but CTR is the primary value-add for us.

---

## Data Mapping: PersonData → MissingBenefit Answers

### What we already collect (zero extra questions needed)

| Our field | MB field | Mapping |
|-----------|----------|---------|
| `age` | `dateOfBirth` | Estimate: `{day:"1", month:"6", year: String(currentYear - age)}` |
| `postcode` | `postcode` | Direct |
| `relationship_status` | `relationshipStatus` | `single\|separated\|widowed` → `"single"`, `couple_*` → `"couple"` |
| `housing_tenure` | `housingStatus` | `rent_social` → `"renting-social"`, `rent_private` → `"renting-private"`, `own_mortgage` → `"homeowner-mortgage"`, `own_outright` → `"homeowner-outright"`, `homeless` → `"homeless"`, `living_with_family` → `"living-with-others"` |
| `employment_status` | `employmentStatus` | `employed` → `"employed-full-time"`, `self_employed` → `"self-employed"`, `unemployed` → `"unemployed"`, `retired` → `"retired"`, `student` → `"student"`, `unable_to_work` → `"unable-to-work"` |
| `children[]` | `hasChildren` + `numberOfChildren` | `children.length > 0` → `"yes"` |
| `is_carer` | `isCarer` | Direct boolean → `"yes"/"no"` |
| `carer_hours_per_week` | `caringHoursPerWeek` | `>= 35` → `"35-or-more"`, else `"under-35"` |
| `has_disability_or_health_condition` | `hasHealthCondition` | Direct |
| `disability_benefit_received` | `receivingDisabilityBenefit` | Map to `"pip"/"dla"/"attendance-allowance"/"none"` |
| `household_capital` | `savingsAmount` | Map to band: `< 6000` → `"under-6000"`, etc. |

### What we don't collect but MB uses for CTR

| MB field | Impact on CTR | Default behaviour |
|----------|---------------|-------------------|
| `councilTaxBand` | Which band's rate to use | Defaults to Band D (national median) |
| `weeklyRent` | UC housing element (indirect) | Omitted — CTR calc still works |
| `monthlyEarnings` | Means-test taper | Mapped from `income_band` midpoint |
| `savingsAmount` | Capital test | If missing, assumes low (reasonable for target users) |
| `nonDependantAdults` | Non-dependant deductions | Omitted — slight overestimate possible |
| `immigrationStatus` | Eligibility filter | Defaults to `"uk-irish"` (our scope excludes immigration) |

### Income band → monthlyEarnings mapping

We collect income as bands, MB wants exact monthly figures. Use band midpoints:

| Our income_band | Midpoint (annual) | monthlyEarnings |
|----------------|-------------------|-----------------|
| `under_7400` | £3,700 | £308 |
| `under_12570` | £10,000 | £833 |
| `under_16000` | £14,285 | £1,190 |
| `under_25000` | £20,500 | £1,708 |
| `under_50270` | £37,635 | £3,136 |
| `over_50270` | £60,000 | £5,000 |

---

## Sampling Test Results (for Tom)

### Finding: Sampling is declared but not functional

The `calculate-benefits` tool description says *"Supports MCP sampling for conversational data collection when the client advertises sampling capability"* — testing shows it's not implemented yet.

**What we tested:**

1. **Server doesn't advertise sampling capability.** The `initialize` response returns:
   ```json
   {"capabilities": {"tools": {"listChanged": true}, "resources": {"listChanged": true}, "prompts": {"listChanged": true}}}
   ```
   No `"sampling"` key. Per the MCP spec (2025-06-18), servers that support sampling should advertise it here.

2. **Client advertising sampling has no effect.** We sent `"capabilities": {"sampling": {}}` in the init request. Server returns the same capability set.

3. **Missing data returns text guidance, not sampling requests.** When `calculate-benefits` is called with sparse data (no `skipDataCheck`), it returns a text content block: *"Please ask the user for this information and call calculate-benefits again."* This is a standard tool result, not a `sampling/createMessage` JSON-RPC request.

4. **`skipDataCheck: true` bypasses the check entirely.** Calculates with whatever data is available and notes quality in `_dataQuality.missingFields`.

### What sampling should do (per MCP spec 2025-06-18)

The flow is **server → client → LLM → client → server**, all within a single tool call:

```
Client calls:  tools/call calculate-benefits {answers: {postcode: "SW1A 2AA"}}

  Server sees missing fields, sends back to client:
    sampling/createMessage {
      messages: [{role: "user", content: "I need the user's date of birth
        and relationship status to calculate benefits. Please ask them."}],
      systemPrompt: "You are collecting information for a UK benefits calculation.",
      maxTokens: 200,
      modelPreferences: {speedPriority: 0.9, intelligencePriority: 0.3}
    }

  Client routes to LLM → LLM asks user → user answers → client returns:
    {role: "assistant", content: "They are 44 and single"}

  Server parses answer, sees more fields needed, sends another:
    sampling/createMessage { ... "I also need employment status and housing" ... }

  Client→Server: {role: "assistant", content: "Unemployed, renting privately"}

Server has enough data, returns final tool result:
  {benefits: [...], totalAnnual: 6344.83}
```

The key difference from the current behaviour: **sampling keeps the server in control of the data collection loop**. The tool call doesn't return until the server has everything it needs. Without sampling, the client's LLM has to parse the text guidance, decide what to ask, and make a second `tools/call` — which is fragile and shifts orchestration burden to the client.

### What Tom needs to implement

1. **Advertise in capabilities**: Add `"sampling": {}` to the server's `initialize` response
2. **Detect client support**: Check if the client's init included `"capabilities": {"sampling": {}}`
3. **Send `sampling/createMessage`** instead of returning text guidance when fields are missing
4. **Parse the LLM response** to extract structured answers (this is the hard part — natural language → answer keys)
5. **Loop or finish**: Either send another sampling request for remaining fields, or calculate and return
6. **Fall back gracefully**: If client doesn't advertise sampling, behave as now (text guidance or `skipDataCheck`)

### Security note from the MCP spec

> For trust & safety and security, there SHOULD always be a human in the loop with the ability to deny sampling requests.

Clients are expected to show sampling requests to the user for approval. Tom's server should assume the user will see the prompts.

---

## Architecture: Experimental Page

### What this is

A standalone page at `/experiment/council-tax` that:
- Accepts PersonData (hardcoded test personas or manual JSON input)
- Maps it to MissingBenefit's answer format
- Calls `calculate-benefits` via Lambda proxy
- Displays CTR results with breakdown

**Not linked from the frontend.** No route in the main app navigation. Accessed directly by URL only, for internal testing and validation.

### Component structure

```
src/
  services/
    missing-benefit.ts         — PersonData → MB answers mapping + API client
  types/
    missing-benefit.ts         — MB response types
  pages/
    ExperimentalCTR.tsx        — standalone page with test personas + results display
```

### API call (Lambda proxy)

The MB MCP key must not be exposed client-side.

- New Lambda function `missing-benefit-proxy` in eu-west-2
- Client POSTs mapped MB answers → Lambda calls MB MCP endpoint → returns result
- API key stored in Lambda environment variable
- Rate limit: inherits MB's 120 req/min
- Endpoint: `POST /api/experiment/ctr`

### Lambda proxy flow

```
Client POST /api/experiment/ctr {answers: {...}}
  → Lambda:
    1. MCP initialize (with session)
    2. notifications/initialized
    3. tools/call calculate-benefits {answers, skipDataCheck: true}
    4. Parse SSE response
    5. Return JSON to client
```

---

## Test plan

### Unit tests (Vitest, no API)

| ID | Test | What it verifies |
|----|------|-----------------|
| MB-01 | PersonData → MB answers mapping | All field mappings produce valid MB values |
| MB-02 | Income band midpoint mapping | Each band maps to correct monthly figure |
| MB-03 | Missing fields handled | Absent optional fields don't cause errors |
| MB-04 | Couple mapping | partner_age, partner fields mapped correctly |
| MB-05 | Children mapping | children[] → hasChildren + numberOfChildren |
| MB-06 | Housing tenure mapping | All 6 tenure types map correctly |
| MB-07 | Employment status mapping | All status values map correctly |
| MB-08 | Response parsing | MB response → our display types |
| MB-09 | Error/timeout handling | API failure → graceful fallback message |
| MB-10 | Confidence label mapping | Score → High/Medium/Low label |

### Integration tests (requires MB MCP key)

| ID | Test | What it verifies |
|----|------|-----------------|
| MB-INT-01 | Unemployed renter, London postcode | Returns CTR with council name + confidence |
| MB-INT-02 | Retired pensioner, Leeds | Pension-age scheme, 100% reduction |
| MB-INT-03 | Working-age, Waltham Forest | Banded scheme, confidence 95% |
| MB-INT-04 | Scottish postcode | Verify whether MB covers Scotland or returns graceful error |
| MB-INT-05 | Welsh postcode | Verify whether MB covers Wales or returns graceful error |

---

## Ship order

1. **Types** — `src/types/missing-benefit.ts`
2. **Service** — `src/services/missing-benefit.ts` (PersonData → MB answers mapping + MCP client)
3. **Unit tests** (MB-01 to MB-10)
4. **Lambda proxy** — new function, API key in env
5. **Experimental page** — `src/pages/ExperimentalCTR.tsx` (test personas + results)
6. **Route** — `/experiment/council-tax` (no nav link)
7. **Integration tests** (MB-INT-01 to MB-INT-05)

---

## Open questions

1. **Scotland/Wales coverage** — MB's CTR confidence resource shows 293 *English* billing authorities. Does it cover Scottish/Welsh councils?
2. **Rate limit sharing** — Our 120 req/min is per API key. If MB has other consumers on the same key tier, we might need to discuss limits with Tom.
3. **Attribution** — Should we credit MissingBenefit on the experimental page?
4. **Data freshness** — How often does Tom update his council scheme data?
