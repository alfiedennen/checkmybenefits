# Friction-Gated Entitlements: UK Government Policies Where No Good Service Exists

**A research inventory of what UK citizens are owed but don't claim, and what could be built to fix that.**

*Working document — February 2026*

---

## The Thesis

Tom Loosemore nailed it: many UK public services rely on friction to stay viable. The slow, confusing, frustrating user experience *is* the demand management tool. Not the law, not eligibility — the hassle. AI agents are about to remove that friction entirely. Your agent will navigate the byzantine process, craft the perfect application, treat every appeal as just another step, and do it all for 12p and zero of your time.

The question is: what are all the specific policies and entitlements where this gap exists? Where has the government created a right but not built a decent service to exercise it?

This document maps that terrain.

---

## The Scale

The headline number is staggering. Policy in Practice's February 2025 "Missing Out" report estimates **£23 billion** in income-related benefits and social tariffs go unclaimed every year in Great Britain. Including disability benefits and discretionary support pushes the true figure past **£30 billion**.

That's not fraud. That's not ineligibility. That's people who are *entitled by law* to money the government has budgeted for, but who don't get it because the system is too complex, too stigmatising, or too deliberately hostile.

On top of the welfare billions, there's an unknown but substantial amount in:
- Unclaimed tax allowances (Marriage Allowance alone: ~2 million eligible couples not claiming)
- Unclaimed transport compensation (Delay Repay: £80m+ per year)
- Unclaimed flight compensation (UK261: millions unclaimed)
- Unchallenged council tax bands (mass over-banding from rushed 1991 valuations)
- Unapplied-for SEND support (90%+ tribunal success rate suggests systematic under-provision)

---

## The Model: What "Good" Looks Like

Tom's Fuel Finder app (fuelfinder.shop) demonstrates the pattern perfectly:

1. **Government publishes data** — the Fuel Finder API went live Feb 2026 under the Motor Fuel Price (Open Data) Regulations 2025. Petrol stations must report prices within 30 minutes of any change.
2. **Someone builds a simple, useful thing on top of it** — Tom built the app on a train from Bristol to London. That's it.
3. **Citizens get value** — real-time fuel price comparison, zero friction.

The Fuel Finder scheme is a statutory open data scheme under the Data (Use and Access) Act 2025. It's the model: government creates the right/data, then someone builds the service layer that actually makes it usable.

For many of the entitlements below, step 1 already exists (the legal right is there), but step 2 is missing or terrible.

---

## Category 1: Welfare Benefits — £23bn Unclaimed

### Universal Credit — ~£7.5-9.6bn unclaimed
- **The right:** Means-tested benefit for working-age people on low incomes or out of work
- **Who's missing out:** ~1.2 million eligible households not claiming
- **The friction:** Complex application, 5-week initial wait, digital skills barrier (8.5m UK adults lack essential digital skills), conditionality regime, stigma
- **What exists:** GOV.UK application, entitledto.co.uk calculator, Policy in Practice's Better Off Calculator
- **What could be built:** An agent that gathers your financial information, determines eligibility, pre-fills the application, and guides you through the process. Could integrate with Open Banking to auto-populate income data.

### Council Tax Support — ~£2.8-3bn unclaimed
- **The right:** Reduction in council tax for people on low incomes
- **Who's missing out:** ~2.7 million eligible people
- **The friction:** 300+ different local schemes (each council runs its own), no national standardisation, separate application from UC, many people don't know it exists
- **What exists:** Individual council websites, some councils proactively identify eligible residents
- **What could be built:** A postcode-lookup service that identifies your local scheme, checks eligibility against your circumstances, and generates the application. This is fragmented by design — an agent that understands all 300+ schemes would be genuinely transformative.

### Pension Credit — ~£3.5bn unclaimed
- **The right:** Top-up for pensioners on low incomes (also a gateway to other benefits like free TV licence, Winter Fuel Payment, Council Tax Reduction)
- **Who's missing out:** ~880,000 eligible pensioners
- **The friction:** Complex eligibility rules, pensioners less digitally confident, many don't realise they qualify, application requires detailed financial information
- **What could be built:** A simplified checker that asks plain-English questions about savings, income and housing, then auto-generates the application. Critically, should flag the cascade of other benefits that Pension Credit unlocks (it's a "gateway benefit").

### Attendance Allowance — ~£5.2bn unclaimed
- **The right:** Tax-free payment for people of pension age who need help with personal care due to disability
- **Who's missing out:** Potentially millions — Policy in Practice estimates £5.2bn unclaimed
- **The friction:** People don't know it exists, the form is daunting, no means test but people assume there is one, many eligible people think they're "not disabled enough"
- **What could be built:** A conversational tool that walks through daily living activities in plain language, maps responses to the legal criteria, and generates a strong application. This is arguably the single biggest quick win — no means test, just need to describe your care needs properly.

### Child Benefit (via High Income Child Benefit Charge)
- **The right:** Universal payment for each child, but many higher earners opt out due to HICBC complexity
- **Who's missing out:** Families where highest earner is over £60,000 who've stopped claiming entirely rather than navigate the tax charge
- **The friction:** Complex interaction between universal benefit and tax system, need to file self-assessment, fear of overpayment penalties
- **What could be built:** A calculator that shows the net benefit after HICBC, plus explains NI credit implications for the non-working parent (critical for state pension entitlement).

### Broadband/Water/Energy Social Tariffs — massively underclaimed
- **The right:** Reduced-rate utility bills for people on certain benefits
- **Who's missing out:** 97% of eligible households not claiming broadband social tariffs
- **The friction:** Different providers, different eligibility criteria, need to prove you're on qualifying benefits, annual re-application
- **What could be built:** Single checker across all utility providers, auto-identifies which tariffs you qualify for, generates applications. Could integrate with UC/PC claim status.

---

## Category 2: Tax Entitlements

### Marriage Allowance — ~2 million couples missing out
- **The right:** Transfer £1,260 of personal allowance from non-taxpayer to basic-rate taxpayer spouse/civil partner, saving up to £252/year (up to £1,259 with 4-year backdate)
- **The friction:** Many couples don't know it exists, confusion about eligibility, third-party claims companies take 35%+ cut, can be backdated 4 years
- **What exists:** HMRC online application (actually quite straightforward once you know about it)
- **What could be built:** Proactive notification — if HMRC already has the data (marriage status, income levels), they could auto-apply. An agent could check eligibility in seconds and walk you through the free HMRC application.

### Tax-Free Childcare — significantly underclaimed
- **The right:** Government tops up childcare payments by 20% (up to £2,000/child/year, £4,000 for disabled children)
- **The friction:** Must re-confirm eligibility every 3 months, complex income thresholds, interacts badly with the £100k personal allowance taper
- **What could be built:** A combined childcare entitlement checker covering TFC, 15/30 free hours, and UC childcare element, showing which is most valuable. Plus a reminder service for quarterly re-confirmation.

### Pension Contributions Optimisation (near £100k earners)
- **The right:** Various — personal allowance taper, childcare eligibility cliff edges
- **The friction:** The interaction between £100k income, personal allowance tapering (effective 60% marginal rate), and loss of childcare entitlements creates a zone where a £500 pay rise can cost you £15,000+. Most people don't understand this.
- **What could be built:** A salary sacrifice/pension contribution calculator specifically for the £100k-£125k zone, showing the true marginal cost of each additional pound earned and the optimal pension contribution to retain childcare/personal allowance.

---

## Category 3: Transport Compensation

### Delay Repay — £80m+ unclaimed per year
- **The right:** Compensation when your train arrives 15+ or 30+ minutes late (depending on operator), ranging from 25% to 100% of ticket price
- **Who's missing out:** 29% of eligible passengers don't claim (YouGov/Trainline, Dec 2025); only 47% submit claims overall (RMT)
- **The friction:** Different operators have different schemes, manual form-filling (58% say it takes 6+ minutes), no standardised process, independent retailers can't offer one-click claims, must keep ticket, 28-day deadline
- **What exists:** Trainline now tracks delays and sends notifications; some operators offer one-click claims for their own ticket sales
- **What could be built:** Tom Loosemore explicitly flags this as "doomed" — a fully automated agent that monitors your journey, detects delays, and auto-submits claims. The data exists (real-time train data is public). As Tom says, "you might as well scrap it now and take the pain."

### Flight Compensation (UK261) — millions unclaimed
- **The right:** £220-£520 per passenger for delays of 3+ hours, cancellations, or denied boarding (unless extraordinary circumstances)
- **The friction:** Airlines actively resist paying, "extraordinary circumstances" defence used aggressively, 45% of passengers who know they're eligible don't claim (AirHelp), complex rules about which flights qualify
- **What exists:** Claims companies (AirHelp, Bott & Co, etc.) take 20-35% commission; DIY through airline websites is deliberately obstructive
- **What could be built:** An agent that checks your flight against delay data, determines if extraordinary circumstances apply, generates the claim letter, submits it, and escalates to CEDR/county court if rejected. The airline delay data exists publicly.

---

## Category 4: Housing & Property

### Council Tax Band Challenges
- **The right:** Challenge your council tax band if you believe it's wrong (bands based on 1991 valuations in England/Scotland, 2003 in Wales)
- **The friction:** Risk of band *increasing*, need to research comparable properties, process takes 2-12 months, VOA can't share info about other properties due to "taxpayer confidentiality," form can't be saved mid-completion and times out after 30 minutes
- **What exists:** VOA online challenge process, some comparison tools
- **What could be built:** Exactly what Tom described — an agent that compares your band to neighbours using EPC data, OS Maps, property websites, and floor areas, then assesses whether a challenge is worth the risk and drafts the appeal. The data is all public (EPC register, Land Registry, VOA band listings).

### EPC Data / Energy Efficiency
- **The right:** Access to Energy Performance Certificate data for any property
- **Data available:** The EPC register is open data (opendatacommunities.org/data/domestic-energy-efficiency)
- **What could be built:** An agent that pulls your EPC, identifies the cheapest improvements with the biggest energy savings, checks if you're eligible for government grants (ECO4, Great British Insulation Scheme, BUS), and generates applications. Currently this requires navigating multiple schemes with different eligibility criteria.

### Planning Application Objections/Support
- **The right:** Right to comment on/object to planning applications in your area
- **The friction:** Need to monitor your local planning portal, understand planning law, write effective comments within consultation periods
- **What could be built:** A monitoring agent that watches your local planning portal, alerts you to relevant applications, and helps draft legally-grounded objections or support comments.

---

## Category 5: Education & SEND

### EHCP Applications — systematic under-provision
- **The right:** Education, Health and Care Plan for children with special educational needs that can't be met by standard SEN Support
- **The friction:** 20-week statutory process routinely exceeded, schools discourage applications, local authorities reject to manage budgets, parents must navigate complex legal framework, evidence gathering is overwhelming
- **The scandal:** Over 90% of parents who appeal refusal to tribunal are at least partly successful — this means LAs are routinely and unlawfully refusing assessments they should grant
- **What could be built:** An agent that helps parents: (a) determine if their child likely qualifies, (b) gather and organise evidence, (c) draft the application letter, (d) track statutory deadlines, (e) draft tribunal appeals if refused. IPSEA already provides template letters — an agent could make them dynamic.

### Free School Meals — underclaimed
- **The right:** Free school meals for children in families receiving certain benefits
- **The friction:** Parents must apply separately, stigma, some families don't realise they qualify
- **What could be built:** Auto-enrolment based on benefit receipt data (some councils already do this with LIFT platform data matching).

---

## Category 6: Consumer Rights & Complaints

### Ombudsman Complaints (Energy, Financial, Telecoms, etc.)
- **The right:** Free dispute resolution after 8 weeks of unresolved complaint (or deadlock letter)
- **The friction:** Most people don't know ombudsmen exist, don't know which one covers their complaint, don't know the 8-week rule, complaints need to be structured properly
- **What could be built:** A single entry point that identifies which ombudsman scheme covers your issue, checks you've met the prerequisite steps, and generates a properly structured complaint.

### Section 75 / Chargeback Claims
- **The right:** Credit card purchases between £100-£30,000 are jointly protected by the card issuer (Consumer Credit Act 1974, Section 75)
- **The friction:** Many people don't know this right exists, banks sometimes resist, need to make the claim properly
- **What could be built:** A simple tool: "What did you buy? How much? Did you pay by credit card? What went wrong?" → generates the Section 75 claim letter.

### GDPR Subject Access Requests
- **The right:** Request all personal data an organisation holds about you (free, within 1 month)
- **The friction:** Need to know who holds your data, how to make the request properly, organisations sometimes resist or delay
- **What could be built:** Template generator with organisation-specific delivery addresses and proper legal citations.

---

## Category 7: Government Data & APIs That Exist But Lack Good Services

These are the "Fuel Finder" opportunities — government data that's published but not yet well-served:

| Data Source | What It Contains | Potential Service |
|---|---|---|
| **Fuel Finder API** (live Feb 2026) | Real-time petrol/diesel prices at all UK stations | Price comparison apps ✅ (being built) |
| **EPC Register** | Energy performance data for all domestic/commercial properties | Home improvement prioritisation, grant eligibility |
| **Land Registry Price Paid** | All property sale prices | Council tax band challenge evidence |
| **VOA Council Tax Bands** | Every property's band and comparable properties | Automated band challenge assessment |
| **Food Standards Agency API** | Food hygiene ratings | Already served (ratings.food.gov.uk) |
| **Companies House API** | Company information, accounts, officers | Director lookup, due diligence |
| **Planning data (various)** | Planning applications by local authority | Monitoring and objection tools |
| **NHS API** | GP data, prescriptions, more | Appointment tools, prescription management |
| **MOT History API** | MOT test results for vehicles | Vehicle purchase checks ✅ (served) |
| **DfT real-time train data** | Live departure/arrival times | Delay Repay automation |
| **DVLA Vehicle Enquiry** | Vehicle registration, tax, MOT status | Various ✅ (served) |
| **Environment Agency flood data** | Flood risk by location | Property risk assessment |
| **Ofsted reports API** | School inspection data | School choice tools ✅ (served) |
| **CQC API** | Care home/GP quality ratings | Care choice tools |
| **ONS API** | National statistics | Various analytics |

---

## Prioritisation Framework

For deciding what to build first, score each opportunity on:

1. **Scale of unclaimed value** — How much money/support is going unclaimed?
2. **Friction severity** — How bad is the current experience?
3. **Data availability** — Is the data to build a service already public/API-accessible?
4. **Technical feasibility** — Could an LLM agent + public data actually solve this today?
5. **Risk of harm** — Could automating this process hurt people? (e.g., council tax challenges can go wrong)
6. **Political sensitivity** — Would government welcome or resist this?

### Top Tier (High value, feasible now)

1. **Attendance Allowance checker/applicator** — £5.2bn unclaimed, no means test, just needs plain-language description of care needs, low political risk, massive impact on pensioner poverty
2. **Council Tax Support finder** — £2.8bn unclaimed, 300+ local schemes, an agent that understands them all would be genuinely novel
3. **Delay Repay automation** — £80m+ unclaimed, real-time data exists, technically straightforward, Tom's right that it's "doomed" anyway
4. **Marriage Allowance checker + backdating** — 2m couples, up to £1,259 with backdate, simple eligibility check, quick win
5. **Benefits entitlement maximiser** — pulling together UC, Council Tax Support, Pension Credit, social tariffs, free prescriptions etc. into one "what am I owed?" service

### Second Tier (High value, more complex)

6. **EHCP application assistant** — enormous human impact, legally complex, would need careful design to avoid bad advice
7. **Council Tax band challenger** — high individual value but genuine risk of band increase, needs good risk assessment built in
8. **Flight compensation agent** — airlines actively hostile, may need legal escalation capability
9. **£100k zone optimiser** — pension/childcare/personal allowance interactions, high value for affected families but niche audience

### Third Tier (Monitoring / awareness tools)

10. **Planning application monitor** — useful but lower financial impact per person
11. **Ombudsman complaint generator** — useful when needed but reactive
12. **Energy grant eligibility checker** — multiple overlapping schemes, useful but government keeps changing the schemes

---

## What To Build First

If the goal is a Tom Loosemore-style demo — something you can build quickly that proves the thesis — the strongest candidates are:

**1. "Am I in the wrong Council Tax band?"**
- All data is public (VOA bands, EPC register, Land Registry)
- Exactly the example Tom used
- Visually compelling (map your street, show the bands, flag anomalies)
- Risk disclaimer needed (band can go up)

**2. "What benefits am I missing?"**
- Conversational eligibility checker
- Pulls in UC, Council Tax Support, Pension Credit, social tariffs
- Could start with just one or two benefits and expand
- entitledto.co.uk exists but is form-heavy rather than conversational

**3. "Get my train delay money back"**
- Real-time data available
- Clear rules (15/30 min thresholds, percentage of ticket price)
- Could auto-monitor journeys and trigger claims
- Immediately legible to anyone who's been on a late train

---

## Next Steps

- [ ] Deep-dive the UK Government API Catalogue (api.gov.uk) for all public APIs
- [ ] Map which benefits have digital application pathways vs. paper-only
- [ ] Research existing tools (entitledto, Turn2us, Policy in Practice) and identify gaps
- [ ] Identify which local authorities publish council tax support scheme rules in machine-readable formats
- [ ] Investigate the EPC register API and Land Registry data for council tax band comparison tooling
- [ ] Prototype one of the "build first" candidates
- [ ] Consider whether this inventory itself could become a public resource (like a GitHub repo or website)

---

## Sources

- Policy in Practice, "Missing Out 2024" (Feb 2025): £23bn unclaimed benefits
- Turn2us Benefits Calculator data (Aug 2025): 60% discover unclaimed entitlements
- Disability Rights UK: £19bn estimate (2023)
- Trainline/YouGov (Dec 2025): £80m+ Delay Repay unclaimed, 29% don't claim
- MoneySavingExpert: ~2m couples missing Marriage Allowance
- The Good Schools Guide: 90%+ EHCP tribunal success rate
- Tom Loosemore, LinkedIn (Feb 2026): friction thesis and council tax band experiment
- GOV.UK Fuel Finder API documentation
- Motor Fuel Price (Open Data) Regulations 2025
- New America, "The Demand Machine" (2026): AI and public service demand
