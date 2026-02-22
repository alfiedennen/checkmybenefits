# The Entitlement Engine

## Citizen-centred policy outcome mapping for the UK

*A framework for delivering what people are owed, starting from their lives, not from government's org chart.*

---

## Part 1: The Problem

### How government thinks

Government is organised by department, and departments are organised by policy. Each policy creates a service. Each service has its own application, its own eligibility rules, its own forms, its own timescales, and its own appeals process.

The Department for Work and Pensions runs Universal Credit, Pension Credit, Attendance Allowance, Carer's Allowance, Personal Independence Payment, and Disability Living Allowance. HMRC runs Child Benefit, Marriage Allowance, and Tax-Free Childcare. Your local council runs Council Tax Support, Disabled Facilities Grants, Blue Badge, school admissions, and SEND services. The NHS runs Continuing Healthcare, free prescriptions, and dental treatment. The Department for Education sets EHCP policy but local authorities deliver it. Energy suppliers administer Warm Home Discount on behalf of BEIS. Water companies run their own social tariffs. Broadband providers run theirs.

Each of these organisations has a website. Each expects you to find them. Each asks you to prove your identity. Each wants your personal and financial details. Many of them need *exactly the same information* — your income, your housing costs, your disability, your household composition — but none of them share it.

This is how £23 billion a year goes unclaimed.

### How people think

Nobody wakes up thinking "I should check my eligibility for the Guarantee Credit element of Pension Credit." They think:

> "Mum fell again last night. She can't really cope on her own anymore."

That single sentence touches policy in at least ten different departments and agencies. The person doesn't know that. They shouldn't have to know that. But the entire system is built on the assumption that they do.

The fundamental design failure is this: **government delivers policies, but people experience situations.** The gap between those two things is friction. And that friction is doing enormous harm.

### The cost

Policy in Practice's 2025 "Missing Out" report puts total unclaimed income-related benefits at £23 billion per year. Including disability benefits and discretionary support pushes the true figure past £30 billion.

That breaks down to:

- **£7.5-9.6 billion** in Universal Credit unclaimed by ~1.2 million households
- **£5.2 billion** in Attendance Allowance unclaimed by pensioners who don't know it exists
- **£3.5 billion** in Pension Credit unclaimed by ~880,000 pensioners
- **£2.8 billion** in Council Tax Support unclaimed by 2.7 million people
- **Unknown billions** in Marriage Allowance, Tax-Free Childcare, social tariffs, transport compensation, flight compensation, council tax band over-payments

This is money government has budgeted. These are rights parliament has legislated. The only thing stopping people from receiving them is the system itself.

### Tell Us Once: the precedent that proves the point

There is exactly one place where government has partially solved this problem: death. The Tell Us Once service lets you report a bereavement to most government departments in a single interaction. Over 80% of UK deaths are now reported this way.

Tell Us Once exists because someone recognised that "when someone dies" is a life situation, not a policy area. And that asking a grieving family to separately notify DWP, HMRC, DVLA, the Passport Office, the local council, and the pension service was cruel and unnecessary.

The question is: why does this approach only exist for death?

---

## Part 2: What We've Built

### The product: Situation Screener + Gateway Prioritiser

Check My Benefits is a conversational web tool where a citizen describes their life situation in plain language and receives a prioritised bundle of entitlements they're likely eligible for, with estimated values, gateway/cascade dependencies, and an action plan.

It is an **awareness and prioritisation tool**. It does not submit applications, auto-fill forms, integrate with government APIs, or store user data.

**Current status (V0.2):** 52 entitlements, 48 deterministic eligibility rules, 45 dependency edges, 5 conflict edges. Any life situation supported. 61 eval scenarios at 96% accuracy.

### Constraints

- **Public APIs and open data only.** No government integrations, no private data, no scraping behind auth. Everything must be publicly accessible.
- **Standalone product.** We build it, we ship it, citizens use it. Not a pitch, not a partnership.
- **Deterministic rules + LLM conversation.** The entitlement engine uses deterministic eligibility rules (48 rule checkers in code) with heuristic value estimation from GOV.UK benefit rates. Claude handles situation classification, conversation, and structured data extraction. PolicyEngine integration is wired in but dormant (API requires auth; heuristic ranges are sufficient for the awareness use case).
- **Gateway cascade is the core value.** The sequenced "claim X first, it unlocks Y and Z" journey is the primary differentiator. Every design decision should reinforce this.
- **Complementary positioning.** Not competing with Caddy (adviser-facing), entitledto (form-based calculator), or Turn2us (grants search). We are the conversational, situation-first, cascade-aware layer that doesn't exist yet.

### What it does

- Conversational intake: citizen describes their situation, engine asks targeted follow-up questions
- Situation classification against a defined taxonomy (any situation supported)
- Eligibility assessment: deterministic rules cross-reference circumstances against 52 entitlements
- Gateway/cascade visualisation: shows which benefits to claim first and what they unlock
- Conflict resolution: where entitlements are mutually exclusive (e.g. Tax-Free Childcare vs UC childcare element), calculates which is better
- Value estimation: heuristic ranges based on GOV.UK 2025-26 benefit rates
- Action plan: time-ordered steps with difficulty ratings and links to apply
- Signposting: links to official application routes and professional advice services

### What it does not do

- Submit or auto-fill any application
- Integrate with any government API or database
- Store user data or create accounts (session only, in-browser)
- Provide ongoing monitoring or reminders
- Calculate precise means-tested benefit amounts (estimates and ranges only)
- Cover council-specific Council Tax Support rules (flags "apply to your council" with a link)
- Cover devolved nation schemes (Scotland, Wales, NI — partially supported)

### Entitlement coverage

**52 entitlements across 8 categories:**

| Category | Count | Examples |
|----------|-------|---------|
| Income & work | 8 | Universal Credit, Pension Credit, Carer's Allowance, New Style JSA |
| Health & disability | 10 | PIP, Attendance Allowance, DLA, free NHS prescriptions/dental/sight tests, NHS Low Income Scheme |
| Children & family | 10 | Child Benefit, DLA (child), free childcare (15/30hrs), Tax-Free Childcare, Sure Start |
| Housing | 4 | Housing Benefit, Support for Mortgage Interest, Council Tax Support, Discretionary Housing Payment |
| Energy & water | 4 | Warm Home Discount, Cold Weather Payment, WaterSure, ECO4 insulation |
| Transport | 3 | Concessionary bus travel, VED exemption, Motability |
| Legal & misc | 3 | Court fee remission, Funeral Expenses Payment, 16-19 Bursary |
| Education | 3 | EHCP assessment, free school meals, student maintenance loan |

All 52 entitlements are evaluated for every user regardless of situation classification. The situation taxonomy helps guide conversation flow, but eligibility is checked universally.

### How eligibility assessment works — and its limits

The engine uses **deterministic rule checkers** (48 coded rules in `eligibility-rules.ts`) that test specific PersonData fields against known thresholds. This is not LLM reasoning — it is code.

The LLM (Claude) handles the *conversation* — understanding natural language, extracting structured data, and classifying situations. A code-based extraction fallback (`message-extractor.ts`) catches fields the LLM misses using regex/keyword patterns. This hybrid approach scores 96% on 61 eval scenarios.

Many eligibility rules cannot be fully expressed as simple logical conditions (disability assessments depend on professional judgment, council tax support varies across 300+ local schemes). Where data is incomplete, the engine assigns confidence tiers rather than guessing.

Every result is tagged with a confidence level (`likely`, `possible`, or `worth_checking`) and accompanied by a clear disclaimer that actual eligibility is determined by the administering body. See [accuracy-and-liability.md](accuracy-and-liability.md) for the full framework.

---

## Part 3: The Reframe

*Previously Part 2.*

### From services to situations

The unit of delivery should not be the service. It should be the **life situation**.

A life situation is a recognisable, common circumstance that a person finds themselves in. It is how real people would describe what's happening to them, in their own words, to a friend. It is not jargon. It is not a policy category. It is human.

Life situations have three properties:

1. **They are experienced by the citizen, not defined by government.** "Retiring on a low income" is a life situation. "Pension Credit" is a policy response to that situation.
2. **They cut across departments.** Every significant life situation touches multiple policy areas. That's the whole problem.
3. **They have outcomes.** The citizen in the situation needs things to be true — they need enough money, a warm home, appropriate care, their child's needs met. Those outcomes are what policy is *for*.

### The model

```
LIFE SITUATION
  → OUTCOMES the person needs
    → POLICIES that deliver those outcomes
      → ENTITLEMENTS arising from those policies
        → ACTIONS required to claim each entitlement
          → DATA needed to take each action
```

Working from the bottom up: much of the DATA is the same across multiple ACTIONS (your income, your address, your household). Many ENTITLEMENTS share eligibility criteria. Several POLICIES serve the same OUTCOMES. And all of it flows from one SITUATION that the person is actually experiencing.

The current system forces the citizen to navigate this entire stack, for every single entitlement, independently. The reframe says: describe your situation once, and we'll work the stack for you.

### Gateway benefits and cascade effects

The system is more connected than it appears, but in ways that are invisible to citizens. Certain benefits act as "gateways" — receiving one automatically qualifies you for others, or makes applying for others dramatically easier. Missing the gateway benefit means missing everything downstream of it.

**Pension Credit** is the most powerful gateway benefit in the system. Receiving the Guarantee Credit element of Pension Credit automatically qualifies you for:

- Council Tax Reduction (potentially 100% discount)
- Housing Benefit (potentially full rent paid)
- Free TV licence (if 75+)
- Warm Home Discount (£150 off electricity, applied automatically)
- Cold Weather Payments (£25 per 7-day cold spell)
- Winter Fuel Payment (protected from income clawback)
- Free NHS dental treatment
- Free NHS prescriptions (if not already free by age)
- Help with NHS travel costs
- Free sight tests and vouchers for glasses
- Discretionary Social Fund access
- Royal Mail redirection discount
- Potential eligibility for broadband social tariff

An 80-year-old pensioner who doesn't claim their £30/week Pension Credit isn't just missing £1,560 a year. They're missing the Council Tax discount, the Warm Home Discount, the free dental care, the TV licence. The true value of that one missed claim could be £3,000-5,000 per year.

**Universal Credit** functions similarly for working-age people. Receiving UC can qualify you for:

- Council Tax Support
- Free school meals for children
- Help with NHS health costs (via low income route)
- Healthy Start vouchers (for pregnant women and young children)
- Sure Start Maternity Grant
- Budgeting Advance loans
- Free early education for 2-year-olds (some eligible UC claimants)
- Social tariffs on broadband, water, energy
- Discretionary Housing Payment (if UC doesn't cover full rent)

**PIP/DLA and Attendance Allowance** function as gateways to:

- Blue Badge (automatic with higher rate mobility DLA / specific PIP scores)
- Vehicle Excise Duty exemption (higher rate mobility DLA / enhanced rate PIP mobility)
- Carer's Allowance for whoever looks after you (must receive qualifying disability benefit)
- Disabled Facilities Grant eligibility weight
- Council Tax disability reduction (Band reduced by one level)
- Motability scheme access

**Carer's Allowance** in turn triggers:

- Carer element in Universal Credit
- Carer premium in legacy benefits
- National Insurance credits (protecting state pension)
- Council Tax discount in some local authority areas
- Access to carer support services

The cascade logic means that the *order* in which you claim matters enormously. An agent that understands this can prioritise the gateway claim first, then use that to unlock everything downstream.

---

## Part 4: Life Situation Mapping

Each situation below maps: what the person experiences, what outcomes they need, what entitlements exist to deliver those outcomes, the gateway/cascade dependencies, and the friction points where people currently drop out.

> **Note:** The situations below were originally designed for V0.1 (1-4) with 5-10 planned for later. As of V0.2, all situations are supported — the engine evaluates all 52 entitlements universally regardless of situation classification. The situation mappings below remain useful as design documentation showing the cascade logic and friction analysis for each life event.

---

### Situation 1: "Mum can't cope on her own anymore"

**Who:** Adult children of ageing parents; elderly people themselves

**The experience:** A parent or older relative is struggling with daily tasks — washing, dressing, cooking, getting around. Maybe they've had a fall. Maybe the house is getting colder and dirtier. The family is worried, stretched, doesn't know where to start.

**Outcomes needed:**
- Adequate income for the older person
- Safe, warm, adapted housing
- Appropriate care and support
- Sustainable arrangement for whoever is providing care
- Maintained independence and dignity

**Entitlement bundle:**

| Entitlement | For whom | Administered by | Gateway dependency | Friction level |
|---|---|---|---|---|
| **Attendance Allowance** | The older person | DWP | None — but *is* a gateway itself | HIGH — people don't know it exists, form is daunting, "not disabled enough" barrier |
| **Pension Credit** | The older person | DWP | None — major gateway benefit | HIGH — 880k eligible non-claimants |
| **Council Tax Reduction** | The older person | Local council | Pension Credit = likely 100% reduction | MEDIUM — need to apply separately, 300+ local schemes |
| **Council Tax disability reduction** | The older person | Local council | Evidence of disability-related adaptation | LOW awareness |
| **Warm Home Discount** | The older person | Energy supplier via BEIS | Pension Credit Guarantee = automatic | LOW if Pension Credit in place |
| **Winter Fuel Payment** | The older person | DWP | State Pension age; income under £35k | LOW — mostly automatic |
| **Cold Weather Payments** | The older person | DWP | Pension Credit | AUTOMATIC |
| **Free TV licence** | The older person | BBC/TV Licensing | Pension Credit + age 75+ | LOW if Pension Credit in place |
| **Free NHS prescriptions** | The older person | NHS | Age 60+ (universal) | AUTOMATIC |
| **Free NHS dental treatment** | The older person | NHS | Pension Credit Guarantee | MEDIUM — need HC2 certificate or Pension Credit |
| **Blue Badge** | The older person | Local council | PIP/DLA mobility or assessed mobility need | MEDIUM — application plus possible assessment |
| **Disabled Facilities Grant** | The older person | Local council | Needs assessment, means tested | HIGH — occupational therapy assessment needed, council process |
| **Carer's Allowance** | The family carer | DWP | Older person must receive AA/PIP/DLA | MEDIUM — must prove 35 hrs/week, earnings limit £151/week |
| **Carer's Credit** | The family carer | DWP/HMRC | 20 hrs/week caring | LOW awareness — protects state pension |
| **UC Carer Element** | The family carer | DWP | Must be on UC + caring 35 hrs | MEDIUM — linked to UC claim |
| **NHS Continuing Healthcare** | The older person | Local NHS ICB | Assessed "primary health need" | VERY HIGH — complex assessment, often refused, huge financial impact |
| **Social care assessment** | The older person | Local council | Request to adult social services | HIGH — stretched services, long waits |
| **Energy social tariffs** | The older person | Energy/broadband/water providers | Various — often Pension Credit | MEDIUM — different providers, different rules |
| **Broadband social tariff** | The older person | Broadband providers | Various means-tested benefits | HIGH — 97% of eligible people don't claim |

**The cascade in action:**

```
1. Claim Attendance Allowance (no means test — just describe care needs)
   ↓ unlocks
2. Claim Pension Credit (AA is disregarded from income calc but AA receipt 
   strengthens case + increases award)
   ↓ unlocks
3. Council Tax Reduction (potentially 100%) — separate application to council
4. Warm Home Discount — automatic via energy supplier
5. Free TV licence (if 75+) — automatic
6. Cold Weather Payments — automatic
7. Free dental treatment — show Pension Credit award letter
8. Broadband/water social tariffs — apply to each provider
   ↓ meanwhile
9. Carer's Allowance for the family member caring 35hrs/week
   (now possible because older person receives Attendance Allowance)
   ↓ unlocks
10. Carer's Credit (NI protection for state pension)
11. UC Carer Element if applicable
    ↓ separately
12. Council Tax disability band reduction (if adaptations installed)
13. Disabled Facilities Grant application
14. Blue Badge if mobility affected
15. Social care needs assessment
```

**Current citizen experience:** The family has to discover and navigate each of these independently. They typically find one or two (maybe Attendance Allowance, maybe Council Tax Reduction) and miss the rest. The person providing care rarely claims Carer's Allowance and almost never claims Carer's Credit. The gateway benefits go unclaimed, so everything downstream is lost too.

**Agent experience:** Describe the situation once. Agent identifies the full bundle. Agent prioritises: "First, let's get Attendance Allowance sorted — it has no means test, and it unlocks several other things. I'll walk you through the form. Then we'll claim Pension Credit, which will automatically trigger Warm Home Discount and make your mum eligible for about six other things..."

---

### Situation 2: "We're expecting a baby"

**Who:** Parents-to-be, from any income level

**The experience:** Excitement mixed with anxiety about costs, time off work, childcare, and navigating a blizzard of entitlements and schemes that nobody explains in one place.

**Outcomes needed:**
- Protected income during maternity/paternity/shared parental leave
- Support with costs of pregnancy and early childhood
- Childcare access when returning to work
- Child's health and development supported
- Housing adequate for growing family

**Entitlement bundle:**

| Entitlement | Eligibility | Administered by | Notes |
|---|---|---|---|
| **Statutory Maternity Pay (SMP)** | Employed, earning above LEL, 26 weeks service | Employer (via HMRC) | 90% of pay for 6 weeks, then £184.03/week for 33 weeks |
| **Maternity Allowance** | If not eligible for SMP | DWP | £184.03/week or 90% of earnings |
| **Statutory Paternity Pay** | Employed, earning above LEL | Employer (via HMRC) | Up to 2 weeks |
| **Shared Parental Leave/Pay** | Either parent | Employer (via HMRC) | Complex — converts unused maternity leave |
| **Child Benefit** | Universal (but HICBC interaction above £60k) | HMRC | £26.05/week first child — ALWAYS claim for NI credits |
| **Sure Start Maternity Grant** | On qualifying benefits + first child | DWP | £500 one-off, must claim within 11 weeks of birth |
| **Healthy Start** | Under 18 or on qualifying benefits, pregnant/with under 4s | NHS | Vouchers for milk, fruit, veg, vitamins |
| **Free prescriptions** | Pregnant women + 12 months post-birth | NHS | MatEx certificate from midwife |
| **Free dental treatment** | Pregnant women + 12 months post-birth | NHS | MatEx certificate |
| **UC (if applicable)** | Means tested | DWP | Child element added; childcare costs element if working |
| **15 hours free childcare** | Universal for 3-4 year olds (from 9 months for eligible working parents) | Local council/provider | Must apply via Childcare Choices |
| **30 hours free childcare** | Working parents, both earning >16hrs at NMW, neither >£100k | Local council/provider | Must reconfirm every 3 months |
| **Tax-Free Childcare** | Working parents, both earning >16hrs at NMW, neither >£100k | HMRC | 20% top-up, up to £2,000/child/year |
| **Housing: right to return to same job** | Employed | Employment law | Not a benefit but a critical right |
| **Council Tax — household recalculation** | If circumstances change | Local council | May affect single person discount, may need to update |

**Critical decision point — Tax-Free Childcare vs. UC childcare element:**

These are mutually exclusive. You cannot claim both. For lower-income families, the UC childcare element (covers 85% of costs up to £1,014.63/month for two children) is often significantly more generous than Tax-Free Childcare. But many families default to TFC because it's better-known, losing hundreds of pounds a month.

**The £100k cliff edge:**

For families where one parent earns near £100,000, this situation triggers one of the most punishing interactions in the tax system. Earning £100,500 instead of £100,000 can cost £15,000+ per year through the combined loss of personal allowance taper, 30 hours free childcare, and Tax-Free Childcare. The optimal response (salary sacrifice into pension to stay below £100k) is well-known to accountants but invisible to most families.

**Agent experience:** "Congratulations! Let me work through what you're entitled to. To start, I need to know roughly what you and your partner earn, whether you're employed or self-employed, and your postcode. From that I can map out everything from maternity pay through to childcare schemes — including which childcare option saves you most money, which is a decision most people get wrong."

---

### Situation 3: "My child is struggling at school"

**Who:** Parents whose child has additional needs — learning difficulties, autism, ADHD, speech and language delays, physical disabilities, mental health conditions

**The experience:** Frustration, guilt, advocacy fatigue. The school says they're doing everything they can. The child is falling behind, anxious, maybe being excluded. The parent knows something is wrong but doesn't know how to navigate the system. Local authorities systematically under-provide to manage budgets.

**Outcomes needed:**
- Child's educational needs identified and met
- Appropriate support in place at school
- Family income adequate (caring responsibilities often reduce earning capacity)
- Child's health and wellbeing supported
- Parent's own wellbeing sustained

**Entitlement bundle:**

| Entitlement | Key facts | Friction level |
|---|---|---|
| **SEN Support at school** | School's legal duty; no application needed | MEDIUM — schools vary wildly in quality |
| **EHCP assessment** | Parent can request directly from LA; LA must respond in 6 weeks | VERY HIGH — LAs routinely refuse; >90% success at tribunal |
| **EHCP itself** | 20-week statutory timeline; legally binding provision | VERY HIGH — delays, vague wording, unquantified provision |
| **DLA (child rate)** | No means test; for children under 16 with care/mobility needs | HIGH — long form, low awareness for non-obvious conditions |
| **Carer's Allowance** | If parent cares 35hrs/week and child gets middle/higher DLA care | MEDIUM — many parents don't realise they qualify |
| **Carer's Credit** | If caring 20hrs/week | VERY LOW awareness |
| **UC Carer Element** | If on UC + caring duties | MEDIUM |
| **Free school meals** | If on qualifying benefits | LOW but stigma barrier |
| **School transport** | If child can't walk to school due to SEN/disability | MEDIUM — council discretion |
| **Short breaks/respite** | Local authority duty under Breaks for Carers regulations | HIGH — availability varies enormously |
| **Direct payments** | From LA for social care needs | HIGH — complex, not always offered |
| **SEND tribunal appeal** | Free; against LA decisions on EHCP | HIGH process, but >90% success rate |

**The EHCP scandal:**

This deserves special emphasis. Over 90% of parents who appeal to the SEND Tribunal against a refusal to assess are at least partly successful. This statistic means one thing: local authorities are systematically and unlawfully refusing to assess children who qualify. The friction is the point. The process is so gruelling that most parents give up. The ones who get through to tribunal almost always win, which proves the refusals were wrong.

An AI agent that helps parents draft the initial request letter, gather evidence, track statutory deadlines, and escalate to tribunal when the LA refuses — that agent would fundamentally change the power dynamic. The LA's budget management strategy depends on parental exhaustion. Remove the exhaustion, and the strategy collapses.

**Cascade logic:**

```
1. Request EHCP assessment (trigger the 6-week statutory clock)
   ↓ meanwhile
2. Apply for DLA (child) — describe care/mobility needs
   ↓ if DLA awarded, unlocks:
3. Carer's Allowance for the parent providing 35hrs/week care
4. Potential UC Carer Element
5. Council Tax disability reduction if home adapted
6. Blue Badge if child has mobility needs
   ↓ if EHCP refused:
7. Mandatory mediation consideration (certificate obtained in days)
8. SEND Tribunal appeal (free; >90% success rate)
```

---

### Situation 4: "I've lost my job"

**Who:** Anyone made redundant, dismissed, or whose contract ended

**Outcomes needed:**
- Income replacement during job search
- Housing costs covered
- Existing commitments (childcare, bills) manageable
- Health protected
- Rapid return to employment

**Entitlement bundle:**

| Entitlement | Notes |
|---|---|
| **Universal Credit** | Apply within days; 5-week wait for first payment; advance available |
| **New Style JSA** | Contribution-based; doesn't reduce UC but must claim separately |
| **Council Tax Support** | Apply to local council — separate from UC |
| **Mortgage Interest support** | 9-month wait on UC before SMI kicks in (loan, not grant) |
| **Free school meals** | For children, if on UC with income <£7,400 after tax/benefits |
| **Free prescriptions** | If on UC and meet income/capital conditions, or via HC2 certificate |
| **Discretionary Housing Payment** | From council if UC housing element doesn't cover rent |
| **Local welfare assistance** | Council-run emergency support — food, fuel, white goods |
| **Redundancy pay** | Statutory right if 2+ years employed |
| **Notice pay** | Statutory minimum based on length of service |
| **Holiday pay** | For accrued, untaken holiday |
| **Unpaid wages claim** | Employment tribunal if employer doesn't pay |
| **Pension — check workplace scheme** | May need to decide: leave, transfer, or access |
| **Help with energy bills** | Supplier hardship funds, Warm Home Discount eligibility |
| **Social tariffs** | Broadband, water — become eligible once on UC |

**Time-critical cascade:**

The first days matter enormously because of the 5-week UC wait:

```
Day 1: Apply for UC (starts the 5-week clock)
Day 1: Request UC advance payment if needed (up to 1 month's UC, repaid over 24 months)
Day 1: Apply for Council Tax Support (separate system, separate form)
Day 1: Check redundancy pay, notice pay, holiday pay entitlements
Week 1: Apply for New Style JSA if NI contributions sufficient
Week 1: Notify mortgage lender if relevant (forbearance)
Week 1: Check eligibility for free school meals, prescriptions
Week 1: Contact utility providers about hardship/social tariffs
Week 2: Check broadband social tariff eligibility
If not resolved by month 2: Discretionary Housing Payment application
If not resolved by month 2: Local welfare assistance
```

**Agent experience:** "I'm sorry to hear that. Let's move quickly — the first thing is to get your UC application in today, because there's a 5-week wait before the first payment. While we do that, I'll also check if you can get an advance, and we'll apply for Council Tax Support at the same time. I also need to check your redundancy rights — how long were you employed, and were you made redundant or dismissed?"

---

---

> **Situations 5-10** were originally planned for V0.2+. As of V0.2, all situations are supported via universal entitlement evaluation. The design notes below remain as reference for situation-specific cascade logic.

---

### Situation 5: "I'm separating from my partner" *(supported via universal evaluation)*

**Outcomes needed:** Housing stability, child welfare, financial independence, legal protection (especially if domestic abuse)

**Key entitlements:** UC change of circumstances, Council Tax single person discount (25%), Child Maintenance Service, Legal Aid (if domestic abuse/violence), housing allocation if homeless, school meals, potential UC housing element, Discretionary Housing Payment for deposit/rent in advance.

**The hidden cascade:** If the separation involves domestic abuse, Legal Aid may be available (it was removed for most family law in 2012 but retained for DV cases). This is one of the most under-claimed entitlements — many people don't know Legal Aid still exists for anything. Proving DV for Legal Aid purposes requires specific evidence forms that an agent could help compile.

---

### Situation 6: "Someone we love has died" *(supported via universal evaluation)*

**Outcomes needed:** Practical administration handled, financial transition managed, grief supported

**The Tell Us Once precedent** partially addresses this — but only for notifying government of the death. It does NOT proactively identify what the bereaved person might now be entitled to. A surviving spouse might now qualify for:

- Bereavement Support Payment (£3,500 lump sum + up to £350/month for 18 months if under state pension age)
- Widowed Parent's Allowance (legacy, being replaced)
- State Pension changes (possible to inherit some of deceased's entitlement)
- Council Tax single person discount
- Benefit reassessment (household income changed)
- Funeral Expenses Payment (if on qualifying benefits)
- Mortgage/rent changes
- Life insurance / pension death benefits
- Probate and inheritance tax

Tell Us Once cancels the dead person's entitlements. Nothing in the system proactively *opens* the surviving person's new entitlements.

---

### Situation 7: "I'm retiring and money's tight" *(supported via universal evaluation)*

Full Pension Credit gateway cascade as described above, plus state pension check (many people have NI gaps that could be filled with voluntary contributions, often at extraordinary ROI — a few hundred pounds of voluntary NI can increase annual pension by thousands over a retirement).

---

### Situation 8: "I've got a long-term health condition" *(supported via universal evaluation)*

PIP/DLA as gateway → Blue Badge, Carer's Allowance for helper, Motability, vehicle excise exemption, Council Tax disability reduction, plus Access to Work (employment support), Disability Confident employers scheme, reasonable adjustments rights under Equality Act.

---

### Situation 9: "We're moving house" *(supported via universal evaluation)*

Council Tax band check for new property, possible band challenge, change of school, GP re-registration, electoral roll, council tax liability transfer, utility switches, broadband change, potential Stamp Duty relief (first time buyers), Help to Buy ISA/Lifetime ISA bonus, energy grants for new property (EPC-based).

---

### Situation 10: "I'm being treated unfairly" *(supported via universal evaluation)*

Consumer rights situation — covers flight compensation, train delay repay, energy complaints (Ombudsman after 8 weeks), financial complaints (FOS), Section 75 credit card claims, GDPR SARs, parking fine appeals. Cross-cutting: the right to complain, the right to escalate, the right to compensation.

---

## Part 5: Systems Architecture

### What the Entitlement Engine needs to do

1. **Situation intake:** Conversational interface. The citizen describes what's happening in plain language. No jargon, no benefit names, no form numbers. "Mum's struggling to look after herself and I've had to cut my hours at work to help."

2. **Situation classification:** Map the natural language description to one or more life situations. Often multiple situations overlap — "I've just had a baby AND I've been made redundant" is a compound situation with its own interactions.

3. **Circumstance gathering:** Collect the minimum information needed to assess eligibility across ALL potentially relevant entitlements. This is the critical efficiency — ask once, assess everywhere. Key data points include:
   - Who is in the household (ages, relationships)
   - Income sources and amounts (employment, self-employment, pensions, benefits already received)
   - Housing tenure (own, rent, mortgage) and costs
   - Location (postcode — determines local council, local schemes)
   - Disabilities or health conditions (for the person, or someone they care for)
   - Caring responsibilities
   - Employment status
   - Savings/capital

4. **Eligibility mapping:** Cross-reference circumstances against the full entitlement landscape. This includes:
   - National benefits (DWP, HMRC)
   - Local benefits (council-specific schemes — Council Tax Support, DHP, local welfare)
   - Passported benefits (things you qualify for because you receive something else)
   - Cascading triggers (things that become available once you claim a gateway benefit)
   - Cross-cutting rights (consumer, employment, housing, equality)

5. **Prioritisation:** Determine the optimal claiming order:
   - Gateway benefits first (Pension Credit before Council Tax Reduction)
   - Time-critical claims first (UC before anything else when income stops)
   - High-value claims before low-value
   - Simple claims before complex (build momentum)

6. **Action generation:** For each entitlement, generate the specific action needed:
   - Auto-filled application (where digital pathway exists)
   - Draft letter (where postal application required)
   - Phone call script (where telephone claim required)
   - Evidence gathering checklist
   - Deadline tracking (statutory timescales)

7. **Ongoing monitoring:** Circumstances change. The engine should:
   - Track claiming progress (applied → decision → payment)
   - Alert to new entitlements triggered by life changes
   - Remind about time-limited actions (Tax-Free Childcare quarterly reconfirmation)
   - Flag upcoming deadlines (EHCP annual review, DLA renewal)

### Data sources required

**For eligibility assessment:**

| Data | Source | Access method |
|---|---|---|
| Benefit eligibility rules | GOV.UK Content API + legislation | REST API (public, no key required) |
| Local council schemes | Individual council websites | Scraping/manual compilation (no standard API) |
| Council Tax bands | VOA API | Public data |
| Property data | EPC Register, Land Registry | Public data / APIs |
| Energy supplier social tariffs | Ofgem, individual supplier sites | Manual compilation |
| Broadband social tariffs | Provider websites | Manual compilation |
| Water social tariffs | Water company websites | Manual compilation |

**For application support:**

| Action | Current digital pathway | Feasibility |
|---|---|---|
| UC application | GOV.UK online | Agent can guide, cannot auto-submit |
| Pension Credit | GOV.UK online or phone | Agent can pre-fill, guide through |
| Attendance Allowance | Paper form (can print from GOV.UK) | Agent can draft responses to each question |
| Council Tax Support | 300+ council online forms | Agent needs to know local council's form |
| Child Benefit | GOV.UK online | Relatively straightforward |
| Marriage Allowance | HMRC online | Very straightforward |
| EHCP request | Letter to local authority | Agent generates letter |
| Blue Badge | GOV.UK online | Agent can guide |
| Delay Repay | Various train operator sites | Agent can detect delay + generate claim |
| Flight compensation | Airline websites (hostile) | Agent can generate claim letter |

### The 300-council problem

The biggest technical challenge is Council Tax Support. There is no national scheme for working-age people — each of the 300+ billing authorities in England runs its own scheme with its own eligibility rules, its own application form, and its own assessment methodology.

This is the single most important data compilation task. An engine that understands all 300+ schemes and can assess eligibility against the right one based on postcode would be genuinely novel — nothing like this exists today.

Approaches:
1. **Compile rules manually** for the largest councils first (top 50 cover a significant chunk of the population)
2. **Use FOI requests** to obtain scheme documents in machine-readable formats
3. **Scrape council websites** for eligibility calculators
4. **Partner with Policy in Practice** who already have this data in their LIFT platform

### What's been built

**V0.1 — The Situation Screener:** Conversational intake, situation classification, eligibility assessment across 47 entitlements, gateway/cascade visualisation, conflict resolution, action plans. Four core situations with full coverage.

**V0.2 — Full England Coverage (current):** 52 entitlements with 48 deterministic eligibility rules. Universal situation support — any life event, not just the original four. Added NHS health costs, childcare/education, housing/energy/water, transport/legal/misc. 61 eval scenarios at 96% accuracy with hybrid LLM + code extraction.

### What could come next

**V0.3 — Devolved Nations + Council Tax:** Scotland, Wales, NI variants. Working-age Council Tax Reduction (300+ LA schemes).

**V0.4 — The Application Assistant:** For each entitlement, help with the application. Pre-fill where possible. Draft letters. Generate evidence checklists. Track deadlines.

**V0.5 — The Monitor:** Ongoing tracking. "Your Attendance Allowance decision is due within 8 weeks." "Your Tax-Free Childcare reconfirmation is due in 12 days." "Your child's EHCP annual review is coming up."

---

## Part 6: The Entitlement Dependency Graph

This is the core data structure. Each node is an entitlement. Edges represent dependencies (receiving X qualifies you for Y) or conflicts (receiving X means you cannot receive Z).

```
PENSION CREDIT (Guarantee)
  ├── Council Tax Reduction (up to 100%)
  ├── Housing Benefit (full rent)
  ├── Warm Home Discount (£150, automatic)
  ├── Cold Weather Payments (£25 per event, automatic)
  ├── Free TV Licence (if 75+)
  ├── Free NHS Dental Treatment
  ├── Free NHS Prescriptions
  ├── NHS Travel Costs
  ├── Free Sight Tests + Glasses Voucher
  ├── Royal Mail Redirection Discount
  └── Social Tariffs (broadband, water — varies by provider)

ATTENDANCE ALLOWANCE
  ├── Strengthens Pension Credit claim
  ├── Enables Carer's Allowance for carer (if carer not >£151/week)
  │   ├── Carer's Credit (NI protection)
  │   ├── UC Carer Element
  │   └── Council Tax carer discount (some LAs)
  ├── Council Tax disability reduction (if home adapted)
  └── Ignored as income for UC/PC calculations

UNIVERSAL CREDIT
  ├── Council Tax Support (working-age, LA-specific)
  ├── Free School Meals (if income <£7,400)
  ├── Healthy Start (if pregnant/child under 4)
  ├── Sure Start Maternity Grant (if first child)
  ├── Free Early Education for 2-year-olds
  ├── NHS Low Income Scheme (HC2 certificate)
  ├── Social Tariffs
  └── Discretionary Housing Payment (if shortfall)

PIP (Enhanced Mobility) / DLA (Higher Rate Mobility)
  ├── Blue Badge (automatic)
  ├── Vehicle Excise Duty Exemption
  ├── Motability Scheme
  └── Carer's Allowance (for the person's carer)

CHILD BENEFIT
  ├── NI Credits for non-working parent (critical for state pension)
  └── HICBC interaction if highest earner >£60k

--- CONFLICTS ---

Tax-Free Childcare ⟷ UC Childcare Element (mutually exclusive — cannot claim both)
Carer's Allowance ⟷ State Pension (CA replaces SP if CA is higher; underlying entitlement preserved)
Pension Credit ⟷ UC (age-dependent — cannot claim both)
```

---

## Part 7: Design Principles

1. **Start from the person, not the policy.** The first question is never "which benefit do you want to claim?" It's "what's happening in your life?"

2. **Show the bundle, not the benefit.** A single entitlement in isolation is worth X. The full bundle, properly sequenced with gateways and cascades, is worth 3X. Always show the full picture.

3. **Prioritise the gateway.** If someone is eligible for Pension Credit, that's the first thing to sort. Everything else follows. The engine must understand dependency order.

4. **Never make the person learn the system.** No benefit names unless absolutely necessary for the application form. No departmental jargon. No "you need to contact DWP and then separately your local authority." The engine absorbs that complexity.

5. **Be honest about friction that can't be removed.** Some processes require medical evidence, assessments, or in-person interactions. The engine can prepare the person, but can't magic away an occupational therapy assessment. Be clear about what's easy and what's hard.

6. **Handle conflicts and trade-offs explicitly.** Tax-Free Childcare vs UC childcare is a genuine decision with financial consequences. The engine must calculate both and show which is better, not just list both as options.

7. **Include rights, not just benefits.** Consumer rights (Section 75, flight compensation, Delay Repay), employment rights (redundancy, unfair dismissal), and housing rights (disrepair, eviction protection) are entitlements too. They just don't come from DWP.

8. **Design for compound situations.** Real life doesn't fit neat categories. "I've had a baby AND my partner left AND I've been made redundant" is three situations overlapping. The engine must handle intersection, not just union.

9. **Time-awareness matters.** Many entitlements have deadlines — 28 days for Delay Repay, 3 months for SEND tribunal, 6 weeks for LA to respond to EHCP request, 5-week UC wait. The engine must track time.

10. **Respect the person's energy.** Claiming is exhausting. The engine should break things into manageable steps, celebrate progress, and never overwhelm with the full list on day one.

---

## Part 8: Current State and Roadmap

### What's shipped (V0.2 — Full England Coverage)

One conversational page at checkmybenefits.uk. You describe your situation. It asks the minimum follow-up questions needed (household composition, rough income, postcode, any disabilities or caring responsibilities). It returns:

- "Based on what you've told me, here's what you might be entitled to:"
- Ordered list with estimated annual value
- Gateway benefits flagged: "START HERE — this unlocks the others"
- Cascaded entitlements grouped under their gateway
- Total estimated annual value of the full bundle
- Conflict resolution for mutually exclusive benefits (e.g. TFC vs UC childcare)
- Week-by-week action plan with priorities and deadlines
- For each entitlement: one-line description, estimated value, confidence level, difficulty rating, link to apply
- Disclaimer and signposting to professional advice (see [accuracy-and-liability.md](accuracy-and-liability.md))

**52 entitlements** across DWP, HMRC, NHS, DfE, DfT, and MoJ schemes. Any life situation supported. 48 deterministic eligibility rules. 45 dependency edges. 5 conflict edges. 61 eval scenarios at 96% accuracy.

### Version history

- **V0.1** — Situation Screener. 47 entitlements, 24 eligibility rules, 4 core situations, 42 eval scenarios at 95%.
- **V0.2** — Full England coverage. Added NHS health costs (8), childcare & education (7), housing/energy/water (6), transport/legal/misc (5). Universal situation support. 52 entitlements, 48 rules, 61 scenarios at 96%.

### Future directions

These are design directions, not commitments:

- **V0.3 — Devolved nations:** Scotland, Wales, Northern Ireland variants (~30 additional schemes). Council Tax Reduction working-age (300+ LA schemes).
- **V0.4 — Application Assistant:** Help with individual applications. Pre-fill where possible. Draft letters. Generate evidence checklists.
- **V0.5 — Monitor:** Ongoing tracking, deadline reminders, annual review prompts.

Each future version will require its own scope lock, technical spec, and accuracy review before build.

---

## Appendix: Source Data

- Policy in Practice, "Missing Out 2024" (February 2025): £23bn unclaimed
- Turn2us Benefits Calculator data (August 2025): 60% discover unclaimed entitlements
- Disability Rights UK report: £19bn estimate
- Trainline/YouGov (December 2025): £80m+ Delay Repay unclaimed
- MoneySavingExpert: ~2 million couples missing Marriage Allowance
- The Good Schools Guide: >90% EHCP tribunal success rate
- Tom Loosemore, LinkedIn (February 2026): friction thesis
- GOV.UK Content API documentation
- entitledto.co.uk passported benefits reference
- Age UK benefits guides
- Scope EHCP guides
- Citizens Advice benefits and consumer rights guides
- Pension Protection Fund: Tell Us Once used for 80%+ of UK deaths
