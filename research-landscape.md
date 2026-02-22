# Research & Landscape Analysis

## Citizen-First Government Services, Existing Tools, and AI Agents for Public Benefits

*Compiled February 2026*

---

## Part 1: The Intellectual Landscape

### The "life events not departments" framing

The idea of organising government services around citizen life events rather than departmental structures is well-established in academic, policy, and consultancy literature. Our project's specific framing — "government delivers policies, but people experience situations" — is sharper than most, but the underlying concept has deep roots.

**Academic foundations:**
- Alsoud & Nakata, "A Conceptual Life Event Framework for Government-to-Citizen Electronic Services Provision" (ICIS 2011, University of Reading) — proposes a framework with anticipatory and non-anticipatory life events
- Sanati & Lu, "Life-event modelling framework for e-government integration" — knowledge-based model for cross-agency service integration

**Think tank and policy work:**
- Institute for Government, "Joining up public services around local, citizen needs" — five barriers to integration, ten insights for overcoming them
- Institute for Government, "Fixing public services: Cross-cutting problems" — argues services are interdependent, recommends cross-cutting reform approach
- Deloitte, "How government can deliver streamlined life event experiences" — defines a four-level maturity model (see below)
- Capgemini, "Citizen Services for Life" — five foundations for life-event transformation (data sharing, governance, digital identity, human-centred design, transparency)
- Public Digital, "The Citizen-Centric Government" (2019) — invokes Conway's Law, profiles NZ, Singapore, Denmark, Australia, Peru

**UK government policy:**
- GDS, "What we mean by service design" (2016) — design around "whole problems"
- GOV.UK Service Manual — "Map a user's whole problem"
- "A Blueprint for Modern Digital Government" (January 2025) — commits to "once only" rule, proactive services, Service Transformation Team, Digital Wallet. Acknowledges someone managing a disability may access "43+ services across nine organisations"
- GDS Roadmap for Modern Digital Government (2026) — GOV.UK app with personalised and proactive services

### The Deloitte maturity model

The most widely-cited framework for life-event service delivery:

| Level | Description | Examples |
|-------|-------------|----------|
| **Level 1 — Department-centric** | Citizens interact with siloed departments separately | Most UK services today |
| **Level 2 — Life event collections** | Services organised by life events on a portal, but still siloed delivery | GOV.UK Step-by-Step Navigation |
| **Level 3 — Partially integrated** | Some unified access points, limited data sharing | Tell Us Once, Singapore LifeSG |
| **Level 4 — Fully integrated** | Once-only principle, back-end integration, automated workflows | Estonia's proactive parental benefits |

**Our positioning:** The Entitlement Engine delivers a Level 2-3 citizen *experience* without requiring Level 2-3 government *infrastructure*. It substitutes LLM reasoning over structured data for system interoperability. This is genuinely novel — every prior attempt at this maturity level has required government back-end integration.

### Tom Loosemore's friction thesis

Loosemore's February 2026 writing is the most direct intellectual foundation for this project.

**"AI and the End of Friction as a Policy Lever"** (19 Feb 2026):
- Core argument: many public services use friction as a de facto rationing mechanism — poor UX is demand management
- AI agents will eliminate this friction, unleashing demand governments are unprepared for
- Tested an AI agent on council tax band challenges: immediately identified over-banding, gathered evidence, crafted appeal
- Warns governments must "clarify — if not tighten — countless rules, policies, processes" before demand explodes
- Suggests Delay Repay should be scrapped preemptively

**"Tooth and Claw: AI Agents Could Eat Public Services"** (11 Feb 2026):
- Government should publish more APIs ("pure agent food")
- All UK public services should offer test accounts
- GOV.UK's clear writing helps LLMs understand service requirements
- References Martha Lane Fox's 2011 report on services going "wholesale"
- Built MissingBenefit.com as a prototype — API-first, machine-to-machine

**Coverage:**
- Dave Briggs covered the arguments extensively
- James O'Malley's newsletter ("The left is missing out on AI") discusses friction thesis in progressive politics context

**How we differ from Loosemore:** His prototype (MissingBenefit.com) takes the API-first approach — machine-readable entitlement logic for AI agents to consume. Our approach is more citizen-centred — situation-first, conversational, human-to-machine. We start from "what's happening in your life?" rather than "which benefit might you be missing?"

---

## Part 2: International Precedents

### Estonia — X-Road and proactive services

The gold standard. X-Road is a secure data exchange platform connecting hundreds of public and private databases on the "once-only" principle (adopted 2005). 99% of government services online.

Breakthrough: in late 2019, Estonia launched proactive family benefits. When a birth is registered, the system automatically checks 80+ conditions across multiple databases and sends parents a pre-filled benefits proposal. No application needed. Before: 65 minutes per application. After: automatic. 99.99% of registered births checked automatically.

**Relevance:** This is what the Entitlement Engine aspires to in citizen experience, achieved through a completely different mechanism (LLM reasoning vs. back-end data integration).

### Singapore — LifeSG

Access to 100+ government services organised around life moments, with personalised recommendations. Digital (app) and physical (ServiceSG centres) channels. Level 3-4 on Deloitte model. Employment services connect jobseekers to multi-agency training grants with interagency data sharing.

### Denmark — Borger.dk

National citizen portal (launched 2007). 111 million visitors in 2024, 92% satisfaction. Life Event Guides for coherent journeys across situations. Committed to ten new citizen service journeys.

### New Zealand — SmartStart

First life-event service (December 2016) for "having a baby." Integrates 55 services across four government agencies plus two NGOs. Birth registration, IRD number request, and benefit adjustments in one place. 365,000 visitors, 90,000 tax numbers requested, 6,000 fewer visits to MSD.

**Relevance:** Closest international precedent to our "expecting a baby" situation — but SmartStart is navigation and transaction, not eligibility reasoning.

### Finland — AuroraAI

National programme (2019-2022) to use AI to match citizens to services based on life events. Aimed to build a decentralised network with AI modules. Decommissioned in 2023 after implementation phase ended. Struggled with gap between ambitious ethical AI aspirations and practical deployment challenges.

**Lesson:** Ambitious national AI-for-citizens programmes can fail when they try to do too much at once. Our V0.1 scope-lock is a response to this risk.

---

## Part 3: UK Government Initiatives

### Tell Us Once

The only fully realised life-event service in the UK. Covers bereavement and birth notification across 32 government services. 80%+ of UK deaths reported through it. Critically: it only *cancels* the deceased person's entitlements — it does not proactively *open* the surviving person's new entitlements.

### GOV.UK Step-by-Step Navigation

Launched 2018. Organises content into user journeys crossing departmental boundaries. 40+ journeys by June 2019 (getting married, bereavement, starting a business). Each required multi-department collaboration. However: these are content navigation tools — they show steps but don't assess eligibility or prioritise.

### GOV.UK One Login

Single sign-on for government services. 200+ services, 13.2 million identities proven. Authentication infrastructure that could support cross-service data sharing in future, but currently an auth layer only.

### GDS Service Communities

Cross-departmental networks: Start a Business, Employ Someone, Import-Export. Internal collaboration mechanisms, not citizen-facing tools.

---

## Part 4: Competitive Landscape — Existing UK Benefits Tools

### Entitledto (entitledto.co.uk)

- **Founded:** 2000 by Steve Gibson. Employee Ownership Trust since 2024.
- **What it does:** Longest-running independent UK benefits calculator. Means-tested benefits (UC, Housing Benefit, Tax Credits, Council Tax Support, Pension Credit) plus some non-means-tested flagging.
- **Interface:** Traditional multi-page form. Enter postcode, household, income, savings, housing costs, disability/health.
- **Tiers:** Free public calculator (10 calcs/year), paid professional version (190+ organisations).
- **White-label reach:** Powers calculators on StepChange, Age UK, MoneySavingExpert, Citizens Advice, many council websites. De facto infrastructure layer for UK benefits calculation.
- **Gateway cascade:** Partially — calculates multiple benefits simultaneously but does not model cascade as a guided journey. Flat results list.
- **Limitations:** Form-based only; 10-calc free limit; primarily means-tested; no grants, social tariffs, or local discretionary support; no application help; no conversational interface.

### Turn2us (turn2us.org.uk)

- **What it is:** Charity (Elizabeth Finn Care). Benefits calculator + grants search + PIP Helper.
- **Unique differentiator:** Grants search — matches users with non-repayable charitable grants.
- **Interface:** Form-based benefits calculator. Grants search is separate tool.
- **Gateway cascade:** No. Benefits and grants are siloed — no unified journey.
- **Limitations:** Tools are siloed; no conversational interface; grants database coverage unclear; PIP Helper is a step forward but covers only one benefit.

### Policy in Practice (policyinpractice.co.uk)

- **What it is:** B2B/B2G company. Two main products:
  - **LIFT (Low Income Family Tracker):** Data analytics platform for local authorities. Combines council datasets with policy engine to proactively identify households missing support. Closest thing to "proactive outreach" in the market.
  - **Better Off Calculator:** Adviser-facing and public-facing benefits calculator. One of two approved on GOV.UK.
- **Impact:** 1.2 million people, £2 billion in unclaimed benefits identified in one year. ROI of £416 per £1 spent for one council client.
- **Gateway cascade:** LIFT implicitly handles this through analytics (analyst-facing, not citizen-facing).
- **Limitations:** Not direct-to-consumer — relies on councils/advisers as intermediaries. Requires procurement and data sharing. Citizen-facing calculator is traditional form.

### Inbest.ai

- **Founded:** 2015 in Scotland. Pivoted to benefits calculation after pro bono work with credit unions.
- **What makes it different:** Claims most comprehensive coverage — up to 45 state benefits, grants, and social tariffs (including broadband/mobile). Available as app, iframe, API, SDKs.
- **Partners:** 100+ organisations including Lloyds Banking Group, Money and Pensions Service (MoneyHelper). On G-Cloud.
- **Model:** B2B — sells embeddable calculator to banks, fintechs, utilities, councils. Pitch: average £4,000/year discovered reduces customer default risk.
- **Limitations:** Form-based, not conversational. B2B distribution. Does not model gateway cascade.

### GOV.UK official position

GOV.UK does **not** host its own benefits calculator. The benefits calculators page links to Entitledto and Policy in Practice's Better Off Calculator. No first-party calculator, no conversational interface, no cascade logic.

### Other players

- **StepChange:** Uses Entitledto white-label. £9.1 million in additional monthly benefits discovered in 2024.
- **Citizens Advice:** Links to Entitledto and Policy in Practice. Human advice model is gold standard but doesn't scale.
- **Age UK / Age Cymru:** Entitledto white-label. Pension-age focus.
- **Carers UK:** Turn2us calculator. Carer-specific focus.
- **Beam.org:** Homelessness-to-employment charity. Referral-based, not benefits discovery. Adjacent, not competitive.
- **BenefitCalculators.com:** Free calculators, content/affiliate site. No AI.

### Competitive gap analysis

| Gap | Description | Status |
|-----|-------------|--------|
| **No conversational tool** | Every existing tool is form-based. No one asks questions in plain English or adapts based on answers. | Open |
| **Gateway cascade not modelled as user journey** | The concept is well-known in policy circles but no tool walks citizens through "claim X first, it unlocks Y and Z." | Open |
| **Benefits + grants + social tariffs are siloed** | No single tool gives a unified view of everything a citizen could claim across all categories. | Open |
| **No application help** | Every calculator stops at "you may be entitled to X." None help you actually apply. (Turn2us PIP Helper is the sole exception, one benefit only.) | Open |
| **Proactive discovery is B2G only** | Policy in Practice's LIFT can identify missing benefits proactively, but requires council procurement. No direct-to-citizen proactive discovery. | Open |
| **No life-event-triggered entry point** | No tool starts with "what's changed in your life?" rather than "enter your income." | Open |
| **Emotional/stigma barriers unaddressed** | All existing tools are transactional. None address shame, stigma, or distrust. | Open |

### Hands-on comparison (February 2026)

We tested all three GOV.UK-linked calculators side-by-side against Check My Benefits.

#### Turn2us Benefits Calculator

**Flow:** Multi-page form with progress bar. Starts with 5 screening questions (citizenship, right to reside, student, prison, hospital/care home) before any eligibility work begins. Page 2 ("About You") asks postcode, partner status, DOB, partner DOB, mixed-age couple transition dates (2019 and 2021 cutoffs), gender, partner gender — 8+ fields on one page. Continues through housing, children, income, savings, existing benefits, disability. Approximately 10-15 pages depending on branching.

**Strengths:** Well-established (3 million+ calculations/year), thorough, includes "Why are we asking?" expandable explanations for every question. Separate grants search tool is unique.

**Weaknesses:**
- Asks for bank statements and benefits letters before you start — barrier for someone just exploring
- No life-event entry point — you must already know you want to "check benefits"
- Questions use benefit system jargon (mixed-age couple transitional protection, Severe Disability Premium)
- No gateway cascade — results are a flat list of what you may be entitled to
- No action plan or claiming order
- Tools are siloed — benefits calculator and grants search are separate journeys
- Has a chatbot ("Turn2us Assistant") but it's a basic FAQ bot, not conversational eligibility

#### BetterOff Calculator (Policy in Practice)

**Flow:** 5-page form (Household details → Health and caring → Housing → Income → Results). Cleaner UI than Turn2us. Page 1 asks DOB, relationship status, postcode, children count, other adults, current benefits, nationality, student status. Defaults are sensible (No pre-selected for benefits/nationality/student).

**Strengths:** Cleanest UI of the three. GOV.UK-approved. Built by Policy in Practice who also run LIFT (council-side analytics). "Better off in work" comparison mode is unique — shows how income changes affect benefits.

**Weaknesses:**
- Account/login wall (can bypass with "Start Free Calculation" but the login is prominent)
- Same form-first approach — enter your data, get results
- No situation awareness — doesn't know *why* you're checking
- No gateway cascade or claiming order
- No application links or action plan
- Primarily means-tested benefits — limited non-means-tested coverage
- "Save for later" requires account creation

#### Entitledto

**Flow:** 9-step sidebar navigation (Where you live → Your household → Age and disability → Benefits you currently receive → Net income → Housing costs → Council Tax → Research questions → Results). Most granular of the three. First page asks housing status (9 options including shared ownership, supported accommodation, temporary accommodation), tax year, and postcode.

**Strengths:** Most comprehensive calculation engine — powers white-label calculators for Citizens Advice, StepChange, Age UK, MoneySavingExpert. Longest-running (since 2000). Most precise means-tested calculations. Council Tax Support included.

**Weaknesses:**
- Most form-heavy — 9 pages of detailed questions before any results
- Requires exact income figures, savings amounts, housing costs — you need paperwork to hand
- Opens with housing status (9 technical options) — intimidating first question for someone who just wants to know what help exists
- No conversational interface
- No gateway cascade — flat results
- No action plan or application guidance
- 10 calculations/year limit on free tier
- Desktop-oriented layout with sidebar navigation — not mobile-first

#### How Check My Benefits differs

| Dimension | Turn2us | BetterOff | Entitledto | Check My Benefits |
|-----------|---------|-----------|------------|-------------------|
| **Entry point** | "Check your benefit entitlement" | "Better Off Calculator" | "What are you entitled to?" | "You could be missing out on thousands of pounds" |
| **First interaction** | 5 screening yes/no questions | Date of birth field | Housing status (9 options) | "What's going on in your life?" in plain English |
| **Interface** | Multi-page form | 5-page form | 9-page form | Conversational chat |
| **Questions** | ~40-60 fields across 10-15 pages | ~25-30 fields across 5 pages | ~50-70 fields across 9 pages | 4-6 natural language questions |
| **Knowledge required** | Need bank statements, benefit letters | Need income/housing figures | Need exact figures for everything | Rough estimates work ("about 12 grand") |
| **Jargon level** | High (transitional protection, SDP) | Medium (benefit categories) | High (housing tenure types) | Low (plain English throughout) |
| **Gateway cascade** | No — flat results list | No — flat results list | No — flat results list | Yes — "claim X first, it unlocks Y and Z" |
| **Action plan** | No | No | No | Yes — week-by-week with priorities |
| **Application links** | No | No | No | Yes — GOV.UK links for each entitlement |
| **Entitlements covered** | ~15 means-tested | ~10 means-tested | ~15 means-tested | 52 (means-tested + non-means-tested + NHS + transport + legal) |
| **Non-means-tested** | Flags some (AA, PIP) | Limited | Limited | Full coverage (AA, PIP, DLA, Blue Badge, Motability, EHCP, etc.) |
| **Social tariffs** | No | No | No | Yes (broadband, water, energy) |
| **Conflict resolution** | No | "Better off" comparison mode | No | Yes (e.g. TFC vs UC childcare — calculates which is better) |
| **Privacy** | Cookies, tracking, calculation references | Account system, cookies | Account system, 10-calc limit | Zero storage, no cookies, no accounts |
| **Mobile experience** | Responsive but form-heavy | Good | Desktop-oriented sidebar | Mobile-first conversational |
| **Precision** | High (exact calculations) | High (exact calculations) | Highest (most granular) | Ranges (heuristic estimates from GOV.UK rates) |
| **Time to complete** | 15-25 minutes | 10-15 minutes | 20-30 minutes | 2-3 minutes |

**The core trade-off:** The existing calculators optimise for *precision* — they want exact figures to calculate exact entitlements. Check My Benefits optimises for *discovery* — it wants to quickly show you what you might be missing and what to do about it. These serve different points in the user journey: we catch people who don't yet know what they're looking for; the calculators help people who already know they want to check specific benefits and have their paperwork ready.

**What no competitor does:**
1. Start from a life situation instead of a form
2. Model the gateway cascade as a guided journey
3. Cover non-means-tested benefits, NHS costs, social tariffs, and transport/legal entitlements in a single check
4. Provide an action plan with claiming order
5. Work without any accounts, cookies, or tracking

---

## Part 5: AI Agents for Government Services

### Caddy (UK — most important reference)

- **What:** AI copilot for Citizens Advice advisers. Developed by Incubator for AI (i.AI) with Citizens Advice Stockport, Oldham, Rochdale & Trafford.
- **Deployed:** Six Citizens Advice call centres.
- **Results:** Halved response times across 1,000 calls. 80% of responses ready to use without revision. Advisers twice as confident in accuracy.
- **Design:** Human-in-the-loop — clients always speak to a human, every AI response reviewed by supervisor, only pre-approved trusted sources used.
- **Open source:** Yes.
- **Now also used by:** A Cabinet Office team for grant decisions.

**Relevance:** Caddy is a proof-of-concept for AI in exactly our domain. Key decision: build on it, complement it, or differentiate. Our project is direct-to-citizen; Caddy augments advisers. These could be complementary rather than competing.

### Nava PBC (US)

- **What:** LLM chatbot for benefits navigators, piloted with Imagine LA.
- **Covers:** SNAP, WIC, Medicaid eligibility questions, application steps, documentation, programme interactions.
- **Design:** RAG approach with source citations. Multilingual. Augments human navigators.
- **Open source:** github.com/navapbc/labs-decision-support-tool
- **Key learning:** Direct-answer LLM attempts were unreliable; refined RAG with citations worked better.

Four AI tools from Nava Labs ($3M from Gates Foundation + Google.org):
1. Navigator chatbot — programme rules Q&A
2. Document verification — GPT-4o for SNAP eligibility docs
3. Call summarisation — notes from navigator-applicant conversations
4. Referral system — community resource suggestions

### Jugalbandi / OpenNyAI (India)

- **What:** Open-source chatbot for government schemes via WhatsApp.
- **Languages:** 10+ Indian languages, voice and text.
- **Covers:** ~171 government schemes.
- **Design:** Voice message → transcription → translation → Azure OpenAI matching → spoken response.
- **Open source:** github.com/OpenNyAI

**Relevance:** Demonstrates how to reach low-literacy, non-digital populations. Voice-first design is important for our audience.

### PolicyEngine UK

- **What:** Open-source tax-benefit microsimulation model on OpenFisca framework.
- **What it does:** Programmatically encodes UK benefits rules (including UC) and calculates entitlements.
- **URL:** policyengine.org/uk/calculator, github.com/PolicyEngine/policyengine-uk

**Relevance:** Could serve as a deterministic rules engine backend for computable eligibility checks, reducing reliance on LLM reasoning for means-tested calculations. Worth investigating as a complement to our LLM-based approach.

### DWP AI initiatives

- Contract worth up to £23 million for conversational AI call steering (not benefits discovery). Expected July 2026.
- Exploring AI chatbot work coaches for UC claimants.
- Working with Anthropic on AI-powered career advice tools.
- Concerns: Amnesty International criticism, bias in AI fraud detection, 64% of welfare advisers report difficulty obtaining UC information.

### Other open source projects

| Project | Country | Description |
|---------|---------|-------------|
| 18F Eligibility APIs | US | Prototype API for federal SNAP eligibility rules |
| Policy2Code | US | Community challenge translating benefits policy into code |
| Digital Benefits Network Rules as Code CoP | International | Shared learning for policy-to-code translation |

---

## Part 6: Critical Counterarguments

### 1. The "Demand Machine" effect

New America's "The Demand Machine: The Realities of AI-Powered Public Service" (2026) argues AI will increase demand for government services before it increases efficiency.

Three types of demand generated:
- **Legitimate unmet needs** — citizens discover eligibility they didn't know about
- **Duplicate/low-value contacts** — repeat submissions, chat loops
- **Higher-complexity work** — automation surfaces edge cases needing skilled staff

Recommendations: forecast volume scenarios before launch; define service-level targets; budget and staff accordingly; establish human oversight.

**Implication for us:** If the tool works, it will generate a wave of new claims. This is a system-level effect that government stakeholders need to be prepared for. Frame it honestly when pitching.

### 2. Friction is often deliberate policy

Herd & Moynihan, "Administrative Burden: Policymaking by Other Means" (Russell Sage Foundation): learning, compliance, and psychological costs are not accidental byproducts but deliberate policy choices. If friction is intentional, removing it may face political resistance.

**Implication for us:** Some stakeholders may not want this tool to exist. The SEND tribunal statistic (90%+ success on appeal) is the clearest example — local authority budget management depends on parental exhaustion.

### 3. Human-in-the-loop is consensus

Every serious project keeps human advisers in the loop. Direct-to-citizen AI advice without human review is considered too risky for vulnerable populations.

**Implication for us:** V0.1 is information/signposting (lower risk), but we should consider positioning as complementary to — not a replacement for — human advice. The accuracy-and-liability framework addresses this.

### 4. Digital exclusion

The people who most need benefits are often least able to use digital tools. Mexico's AI budget platform: 42% of grassroots participants couldn't use it. Brazil's UBI AI review: wrongly judged 23% of rural low-income groups ineligible.

**Implication for us:** Voice/phone channels matter for future versions. V0.1 is web-based but should be mobile-first and as simple as possible.

### 5. Algorithmic harm precedents

- **Australian Robodebt:** Algorithmic welfare debt calculation, thousands of incorrect notices, AU$1.8 billion settlement.
- **Amsterdam Smart Check:** Welfare fraud risk scores that disproportionately flagged immigrants, women, parents.
- **Germany:** AI welfare qualification review led to 300% increase in administrative lawsuits.

**Implication for us:** These are all supply-side (government deciding who gets benefits). We're demand-side (helping citizens claim). Ethically stronger position, but accuracy still matters. Our confidence tiers and disclaimers address this.

### 6. Trust deficit

Max Planck Institute research: welfare recipients reject AI-supported decisions significantly more often than non-recipients. Those most dependent on benefits are most sceptical of automation.

**Implication for us:** Tone, transparency, and honest limitation-acknowledgment are critical. The conversation flow spec's sensitivity handling and the accuracy framework's disclaimer language are designed for this.

---

## Part 7: Strategic Positioning

### How Check My Benefits sits in the landscape

| Dimension | Existing approaches | Our Entitlement Engine |
|-----------|-------------------|----------------------|
| **Entry point** | Benefit name, department, or form | Plain-language life situation |
| **Integration model** | Requires government back-end (X-Road, LifeSG) | LLM reasoning over structured data; no government integration |
| **Scope** | Usually single life event per tool | Cross-cutting; compound situations supported |
| **Cascade logic** | Rarely surfaced to citizens | Core feature: gateway benefits, dependency ordering |
| **Interface** | Form-based | Conversational |
| **Maturity level** | Most UK at Level 1; Tell Us Once at Level 3 | Level 2-3 citizen experience without Level 2-3 infrastructure |

### Key differentiators

1. **Situation-first entry point** — no existing tool starts from "what's happening in your life?"
2. **Gateway cascade as user journey** — no existing tool walks citizens through "claim X first, it unlocks Y and Z"
3. **Routes around government integration** — delivers joined-up citizen experience without requiring departments to share data
4. **Conversational** — every competitor is form-based

### Decisions made

1. **PolicyEngine UK — wired in, dormant.** Integration code is complete but PE API now requires auth (401). Self-hosting assessed at $5-15/mo + ops complexity for marginal precision gain. Heuristic ranges from GOV.UK benefit rates are sufficient for the awareness/discovery use case. Code stays in place at zero cost, ready to activate if PE access is obtained later. Current approach: 48 deterministic eligibility rules in code + LLM for situation classification and conversation.

2. **Direct-to-citizen — YES.** Not an adviser tool. Caddy is adviser-facing; we are citizen-facing. Complementary, not competing.

3. **Standalone build — not a pitch.** We're building this ourselves with public APIs and open data only. No government partnerships or integrations required.

4. **Public APIs and open data only.** No private data sources, no scraping behind auth. Everything must be publicly accessible.

5. **Gateway cascade is the core differentiator.** The "claim X first, it unlocks Y and Z" sequencing is what no other tool provides. This drives the UI, the conversation flow, and the results display.

---

## Sources

### Academic & Think Tank
- Alsoud & Nakata, "A Conceptual Life Event Framework" (ICIS 2011) — centaur.reading.ac.uk/28766/
- Sanati & Lu, "Life-event modelling framework for e-government integration" — semanticscholar.org
- Herd & Moynihan, "Administrative Burden: Policymaking by Other Means" — Russell Sage Foundation
- Institute for Government, "Joining up public services" — instituteforgovernment.org.uk
- Institute for Government, "Fixing public services: Cross-cutting problems" — instituteforgovernment.org.uk
- Deloitte, "How government can deliver streamlined life event experiences" — deloitte.com
- Capgemini, "Citizen Services for Life" — capgemini.com
- Public Digital, "The Citizen-Centric Government" (2019) — public.digital
- New America, "The Demand Machine" (2026) — newamerica.org

### UK Government
- GDS, "What we mean by service design" (2016) — gds.blog.gov.uk
- GOV.UK Service Manual, "Map a user's whole problem" — gov.uk/service-manual
- "A Blueprint for Modern Digital Government" (2025) — gov.uk
- GDS Roadmap for Modern Digital Government (2026) — gds.blog.gov.uk
- GOV.UK Step-by-Step Navigation — OECD OPSI case study
- GOV.UK One Login — sign-in.service.gov.uk

### Tom Loosemore
- "AI and the End of Friction as a Policy Lever" (19 Feb 2026) — tomloosemorework.wordpress.com
- "Tooth and Claw: AI Agents Could Eat Public Services" (11 Feb 2026) — tomloosemorework.wordpress.com
- MissingBenefit.com prototype

### Commentary
- Dave Briggs — da.vebrig.gs/2026/02/19/26424/
- James O'Malley, "The left is missing out on AI" — takes.jamesomalley.co.uk
- Dave Guarino on benefits navigation and AI — daveguarino.substack.com

### International
- Estonia X-Road — e-estonia.com
- Nortal, proactive public services — nortal.com
- Singapore LifeSG — life.gov.sg
- Denmark Borger.dk — en.digst.dk
- New Zealand SmartStart — smartstart.services.govt.nz
- Finland AuroraAI — OECD OPSI
- Nortal, "Proactive Public Services" white paper — nortal.com

### Existing UK Tools
- Entitledto — entitledto.co.uk
- Turn2us — turn2us.org.uk
- Policy in Practice — policyinpractice.co.uk
- Policy in Practice, "Missing Out 2025" — policyinpractice.co.uk/publication/missing-out-2025/
- Inbest.ai — inbest.ai
- GOV.UK Benefits Calculators — gov.uk/benefits-calculators
- StepChange — stepchange.org
- Beam.org — beam.org

### AI & Open Source
- Caddy (i.AI + Citizens Advice) — ai.gov.uk/projects/caddy/
- Stanford Justice Innovation on Caddy — justiceinnovation.law.stanford.edu
- Nava PBC — navapbc.com/labs/ai-tools-public-benefits
- Nava Labs Decision Support Tool — github.com/navapbc/labs-decision-support-tool
- Jugalbandi / OpenNyAI — github.com/OpenNyAI
- PolicyEngine UK — github.com/PolicyEngine/policyengine-uk
- Code for America — codeforamerica.org
- DWP AI call handling contract — The Register
- DWP chatbot testing — The Register

### Ethics & Risk
- Amnesty International on DWP AI
- Max Planck Institute on welfare recipients and AI trust — mpib-berlin.mpg.de
- Brookings, "AI for social protection: mind the people" — brookings.edu
- Australian Robodebt — IPI Global Observatory
- Amsterdam Smart Check — Hunters Law
- AI in Social Work ethics — jswve.org
