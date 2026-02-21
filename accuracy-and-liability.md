# Accuracy and Liability Framework

## The Entitlement Engine — Duty of Care, Disclaimers, and Error Handling

*This document defines how the engine communicates uncertainty, handles errors, and protects users from harm caused by incorrect or incomplete information.*

---

## The Stakes

The Entitlement Engine tells vulnerable people — pensioners, carers, parents of disabled children, people who've just lost their jobs — that they may be entitled to significant sums of money. Some of these people will make decisions based on what the engine tells them: whether to leave a job, how to plan their budget, whether to challenge a local authority.

If the engine is wrong, the consequences are real:

- A pensioner told they're "likely eligible" for Pension Credit plans their finances around expected income that doesn't materialise
- A parent told their child qualifies for DLA invests weeks in a gruelling application that was never going to succeed
- A family chooses UC childcare element over Tax-Free Childcare based on the engine's recommendation, losing hundreds of pounds a year
- Someone told they're entitled to nothing walks away, when in fact they qualified for several things the engine missed

The engine must be honest about what it can and cannot do.

---

## What the Engine Is

The Entitlement Engine is an **information and awareness tool**. It helps people discover support they may not know about, understand how entitlements relate to each other, and identify what to prioritise.

It is **not**:

- Benefits advice (a term with specific professional meaning in the UK welfare rights sector)
- A benefits calculator (it produces estimated ranges, not precise figures)
- A substitute for professional advice from Citizens Advice, welfare rights advisers, or solicitors
- A replacement for the official eligibility check by the administering body (DWP, HMRC, local council, etc.)
- A legal opinion on entitlement

### Regulatory position

In the UK, there is no statutory regulation of benefits information services. However:

- **Benefits advice** delivered by organisations like Citizens Advice is subject to the Advice Quality Standard (AQS) — a quality mark framework covering competence, supervision, and complaints handling
- **Financial advice** is regulated by the FCA — the engine does not provide financial advice (it does not recommend specific financial products or investment decisions)
- **Legal advice** is regulated by the SRA — the engine does not provide legal advice (it does not interpret legislation for specific cases)

V0.1 operates as an information/awareness tool, which does not require AQS, FCA, or SRA registration. However:

- If future versions (V0.3+) begin helping with actual applications, the line between "information" and "advice" may blur. This will need legal review before launch.
- The engine must never use the word "advice" to describe what it provides.
- The engine must always signpost to professional advice services.

---

## Accuracy Model

### How eligibility assessment works

The engine does not compute eligibility deterministically. It uses an LLM (Claude) reasoning over structured entitlement data — a combination of computable conditions (age thresholds, income limits, boolean flags) and natural language descriptions (disability assessment criteria, council-specific schemes, complex interactions).

This means the engine is making **probabilistic judgments**, not definitive calculations. The quality of those judgments depends on:

1. **The quality of the user's input** — vague answers produce vague results
2. **The completeness of the data model** — entitlements not in the model can't be surfaced
3. **The currency of the data** — rates and thresholds change, usually annually
4. **The LLM's reasoning quality** — it may misinterpret edge cases or complex interactions

### Confidence tiers

Every entitlement result must be tagged with one of three confidence levels:

| Tier | Label shown to user | Meaning | When to use |
|------|-------------------|---------|-------------|
| `likely` | "You're likely eligible" | Core eligibility criteria clearly met based on what the user has told us. No significant ambiguity. | Age, income, and circumstance all align clearly with eligibility rules. |
| `possible` | "You may be eligible" | Some criteria met, others uncertain or dependent on information we didn't collect. | Income is close to a threshold, disability assessment required, local scheme rules unclear. |
| `worth_checking` | "Worth looking into" | Situation suggests possible eligibility but we can't assess from what we know. | Complex interactions, council-specific schemes, discretionary awards. |

**Rules for assigning confidence:**

- If any eligibility criterion depends on professional assessment (disability descriptors, care needs, "substantially more care than a child of the same age"), confidence is capped at `possible` unless the user reports already receiving a qualifying benefit
- If the entitlement is administered locally with no national standard (Council Tax Support for working-age people), confidence is capped at `possible`
- If the user declined to answer a question that's material to eligibility (income, savings), confidence is capped at `worth_checking`
- If the entitlement has a means test and the user's income is within 20% of the threshold, confidence is capped at `possible`

### What the engine cannot assess

Some things are genuinely beyond the engine's capability. These should be flagged honestly, not fudged:

- **Disability benefit eligibility** (PIP, AA, DLA): depends on functional assessments by healthcare professionals. The engine can say "you might qualify based on what you've described" but cannot predict assessment outcomes.
- **Council Tax Support (working-age)**: 300+ local schemes, each with different rules. Without the specific scheme data for the user's council, the engine can only flag that it exists and link to the council.
- **Discretionary awards** (Discretionary Housing Payments, local welfare assistance): by definition discretionary — no eligibility rules to assess against.
- **Complex self-employment income**: UC treatment of self-employment income (Minimum Income Floor, permitted period, start-up period) is too complex for a screener.
- **Immigration status interactions**: eligibility for many benefits depends on immigration status in ways that are legally complex and constantly changing. The engine should not attempt to assess this and should signpost to specialist immigration advice.
- **Mixed-age couples**: since May 2019, couples where one partner is under state pension age generally claim UC rather than Pension Credit, with complex transitional protection rules.

---

## Error Modes

### False positives (says eligible, actually not)

**Harm:** False hope, wasted time on applications, possible financial planning based on expected income.

**Most likely causes:**
- User's income is close to a threshold and the engine rounds in their favour
- User has a disqualifying condition they didn't mention (immigration status, capital above threshold, already receiving a conflicting benefit)
- Local scheme rules differ from the national pattern the engine assumes
- Benefit rates or thresholds have changed since the data was last updated

**Mitigation:**
- Confidence tiers prevent the engine from sounding more certain than it should
- Per-result disclaimers remind users that actual eligibility is decided by the administering body
- Signposting to professional advice for high-stakes or complex cases
- Estimated values shown as ranges, never as exact amounts

### False negatives (misses something the user qualifies for)

**Harm:** Same as the status quo (the person doesn't claim), but now with the false assurance of having "checked." This is arguably worse than not checking at all, because it removes the motivation to investigate further.

**Most likely causes:**
- Entitlement not in the data model (local schemes, obscure rights, new policies)
- User's description didn't trigger the right situation classification
- Complex eligibility interaction that the LLM didn't reason through correctly
- User didn't provide enough information for the engine to identify the entitlement

**Mitigation:**
- Explicit "we might have missed something" message on every results page
- Signposting to comprehensive checkers (entitledto.co.uk, Turn2us) as a second opinion
- Signposting to professional advice services for anything complex
- The data model is a living document — add entitlements as gaps are discovered

### Stale data

**Harm:** Incorrect benefit rates, wrong thresholds, entitlements that no longer exist or have changed.

**Most likely causes:**
- Annual benefit uprating (every April) not applied to data model
- Budget or fiscal statement changes thresholds mid-year
- Local council changes its Council Tax Support scheme (usually April, but not always)
- New entitlements created or existing ones abolished

**Mitigation:** See "Data Currency" section below.

### Harmful recommendations

**Harm:** The engine recommends an action that makes the user worse off.

**Specific risks:**
- Recommending UC childcare element over Tax-Free Childcare (or vice versa) when the other is better — this is a real decision with real financial consequences
- Suggesting someone claim a benefit that triggers a reassessment of an existing benefit they'd rather not disturb
- Not flagging that a council tax band challenge can result in the band going UP

**Mitigation:**
- Conflict resolution for mutually exclusive benefits must show the calculation, not just the recommendation
- Where an action has a downside risk, state it clearly: "Be aware that challenging your council tax band can result in it going up, not just down"
- Never use imperative language ("claim this") — always "you may want to look into" or "this is worth checking"

---

## Disclaimer Framework

### 1. Pre-results disclaimer (shown once, before first results)

> **Before we show your results**
>
> This tool helps you discover support you might be entitled to. It is not benefits advice and cannot guarantee eligibility.
>
> The estimates below are based on what you've told us and the information we have about government schemes. They are not exact and may not reflect your full circumstances.
>
> Always check with the organisation that runs the scheme before making any decisions based on what you see here. If your situation is complex or you're unsure, we recommend speaking to a professional adviser.

### 2. Per-result confidence badge

Every entitlement card displays its confidence tier:

- **Likely eligible** — "Based on what you've told us, you appear to meet the main criteria for this. The final decision is made by [administering body]."
- **May be eligible** — "Your situation suggests you might qualify, but we can't be certain from the information we have. It's worth checking with [administering body]."
- **Worth looking into** — "We can't assess this from what we know, but your situation suggests it's worth investigating. Contact [administering body] or a local adviser."

### 3. Results footer (shown after every results page)

> **We try to be thorough, but we can't cover everything.** There may be local schemes, discretionary funds, or entitlements we've missed. Our estimates are based on [tax year] benefit rates and may not reflect recent changes.
>
> For detailed advice tailored to your circumstances:
> - **Citizens Advice** — [citizensadvice.org.uk](https://www.citizensadvice.org.uk) or call 0800 144 8848
> - **Turn2us** — [turn2us.org.uk](https://www.turn2us.org.uk) (benefits calculator and grants search)
> - **entitledto** — [entitledto.co.uk](https://www.entitledto.co.uk) (detailed benefits calculator)
> - **Your local council** — for Council Tax Support, Discretionary Housing Payments, and local welfare assistance
>
> *For SEND support specifically:*
> - **IPSEA** — [ipsea.org.uk](https://www.ipsea.org.uk) (free legally-based SEND advice)
> - **SOS!SEN** — [sossen.org.uk](https://www.sossen.org.uk) (SEND advice and tribunal support)

### 4. Stale data warning

If the benefit rates in the data model are from a previous tax year (i.e., it is after April and rates are tagged with the previous year):

> **Note:** The benefit rates used in these estimates are from the [year] tax year. Updated rates for [current year] may differ. Check GOV.UK for current rates.

### 5. Out-of-scope situation message

When the engine identifies a situation it doesn't cover in V0.1:

> "It sounds like you're dealing with [situation]. We're still building our coverage of this area, so I can't give you a detailed assessment right now. In the meantime, I'd recommend:
>
> - **Citizens Advice** — [citizensadvice.org.uk](https://www.citizensadvice.org.uk) for free, confidential advice
> - **GOV.UK** — [gov.uk/browse/benefits](https://www.gov.uk/browse/benefits) for information about specific benefits
>
> We're adding more situations soon — check back later."

---

## Data Currency

### Rate and threshold management

All benefit rates and thresholds in the data model must be tagged with:

- **Tax year** (e.g., `"tax_year": "2025-26"`)
- **Last verified date** (e.g., `"last_verified": "2025-04-08"`)
- **Source URL** (e.g., `"source": "https://www.gov.uk/pension-credit/what-youll-get"`)

### Update schedule

| Event | When | What to update |
|-------|------|---------------|
| Annual benefit uprating | April each year | All DWP/HMRC benefit rates, thresholds, and caps |
| Budget / Autumn Statement | November (typically) | Tax thresholds, HICBC limits, childcare policy, any announced changes |
| Local council scheme changes | April (usually) | Council Tax Support schemes — this is the hardest to track |
| Ad hoc policy changes | As announced | New entitlements, abolished schemes, rule changes |

### Verification process

For each update:
1. Check GOV.UK for updated rates
2. Cross-reference against at least one independent source (entitledto.co.uk, Citizens Advice, Disability Rights UK)
3. Update the data model JSON
4. Update `last_verified` dates
5. Run test scenarios to check that changed rates produce sensible results
6. If a rate has changed by more than 10%, review all entitlements that reference it for knock-on effects

### Source attribution

Every rate and threshold in the data model should link to its source. In V0.1, this means a `source` field in `benefit_rates.json`. In future versions, this could be surfaced to users: "This rate comes from GOV.UK, last checked [date]."

---

## Tone and Language Rules

These rules apply to all user-facing output:

| Do | Don't |
|----|-------|
| "You may be entitled to..." | "You are entitled to..." |
| "This is worth checking" | "You should claim this" |
| "Based on what you've told us..." | "You qualify for..." |
| "Estimated value: up to £X/year" | "You'll get £X/year" |
| "The final decision is made by [body]" | "We've confirmed your eligibility" |
| "We recommend speaking to an adviser" | "We've covered everything" |
| "We might have missed something" | (omitting this) |

**Never use:**
- "Advice" to describe what the engine provides
- "Guaranteed" or "confirmed" about eligibility
- "You should" (implies blame for not already doing it)
- "Just" before any action ("just fill in the form" — minimises difficulty)
- Exact amounts without the word "estimated" or "up to"

---

## Future Considerations (V0.2+)

As the engine evolves, the accuracy and liability framework must evolve with it:

- **V0.2 (Gateway Prioritiser):** Cascade calculations compound the accuracy risk — if the gateway assessment is wrong, everything downstream is wrong. The confidence model needs to propagate uncertainty through the dependency graph.
- **V0.3 (Application Assistant):** Helping with applications crosses closer to "advice." Legal review needed. Consider whether AQS accreditation is appropriate. Error in application content is higher-stakes than error in awareness.
- **V0.4 (Monitor):** Ongoing tracking means ongoing responsibility. If a deadline is missed because the engine failed to alert, is that the engine's fault? Liability framework needs to address this before V0.4 ships.

Each version increment should trigger a review of this document.
