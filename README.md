# CitizenFirst

A conversational web app that helps UK citizens discover what benefits and support they're entitled to. Describe your situation in plain English, answer a few questions, and get a prioritised bundle of entitlements — including what to claim first and what it unlocks.

**Status:** V0.1 (Situation Screener) — supports any life situation.

## What It Does

Most people don't know what they're entitled to. Government websites list hundreds of benefits but don't tell you which ones apply to *your* situation, or that claiming one benefit can unlock three others. CitizenFirst fixes this.

**The conversation:**
1. You describe what's happening — "My mum can't cope on her own anymore" or "I've just lost my job"
2. It asks 4–6 targeted follow-up questions (household, income, housing, postcode)
3. It produces a personalised entitlement bundle

**The bundle shows:**
- **Gateway entitlements** — claim these first (e.g., Pension Credit)
- **Cascaded entitlements** — unlocked by gateways (e.g., Council Tax Reduction, free prescriptions)
- **Independent entitlements** — claim anytime (e.g., Child Benefit)
- **Conflicts** — mutually exclusive benefits with a recommendation on which is worth more
- **Action plan** — week-by-week steps with priorities and deadlines
- **Total estimated value** — e.g., "You may be entitled to £12,000–£56,000/year"

The gateway cascade — "claim X first because it unlocks Y and Z" — is the core differentiator. No other tool does this for citizens directly.

## Situations Covered

Any life situation is supported. The engine evaluates all 50+ entitlements based on the user's data, regardless of situation classification. Common situations include:

| Situation | Example trigger | Key entitlements |
|-----------|----------------|-----------------|
| Ageing parent | "My mum can't cope" | Attendance Allowance, Pension Credit, Carer's Allowance, Council Tax Reduction |
| New baby | "We're expecting a baby" | Child Benefit, Maternity Allowance, Healthy Start, Tax-Free Childcare |
| Child struggling at school | "My child has ADHD" | DLA (Child), EHCP Assessment, Free School Meals |
| Lost job | "I've been made redundant" | Universal Credit, Council Tax Support, Social Tariff Broadband, Warm Home Discount |
| Health condition / disability | "I have MS and can't work" | PIP, Blue Badge, Council Tax Disability Reduction, UC |
| Bereavement | "My husband died" | Bereavement Support Payment, UC, Council Tax Single Person Discount |
| Separation | "Going through a divorce" | UC, Council Tax Support, Free School Meals |
| Mixed / novel | "I'm homeless with no income" | UC, Council Tax Support, Warm Home Discount |

Multiple situations can overlap. "My mum needs care AND I've lost my job AND my child has autism" produces a combined bundle across all three.

## Architecture

```
User message
  │
  ▼
┌─────────────────────────────┐
│  Claude (conversation + AI  │  Situation classification, empathetic conversation,
│  extraction via XML tags)   │  structured data extraction from natural language
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Code-based extraction      │  Regex/keyword fallback for fields the LLM misses:
│  (message-extractor.ts)     │  postcodes, ages, incomes, housing, relationships
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Entitlement engine         │  Deterministic eligibility rules, value estimation,
│  (bundle-builder.ts)        │  cascade resolution, conflict resolution, action plan
└─────────────┬───────────────┘
              │
              ▼
        Personalised bundle
```

**Frontend:** React 19 SPA, mobile-first, no backend storage
**AI:** Claude Sonnet (via Anthropic API) or Amazon Nova Micro (via Bedrock) — configurable
**Data:** Static JSON entitlement model + GOV.UK benefit rates
**Hosting:** Vercel (static site + serverless API proxy)
**Privacy:** No data stored. Session only. No accounts, no tracking, no cookies.

## Getting Started

### Prerequisites

- Node.js 20+
- An Anthropic API key (`sk-ant-...`)

### Setup

```bash
# Install dependencies
npm install

# Create environment file
echo 'ANTHROPIC_API_KEY="your-key-here"' > .env.local

# Start development (app + API proxy)
npm run dev:full

# Opens at http://localhost:5173
# API proxy runs on http://localhost:3001
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server only (port 5173) |
| `npm run dev:api` | API proxy only (port 3001) |
| `npm run dev:full` | Both dev server + API proxy |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Preview production build locally |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Watch mode tests |

## Project Structure

```
src/
├── App.tsx                          # Root component
├── App.css                          # All styles (single file, ~800 lines)
├── main.tsx                         # React entry point
│
├── components/
│   ├── conversation/                # Chat UI
│   │   ├── ConversationView.tsx     # Message list + input container
│   │   ├── MessageBubble.tsx        # User/assistant message display
│   │   ├── TextInput.tsx            # Input field + send button
│   │   ├── QuickReplyButtons.tsx    # Suggested quick reply chips
│   │   └── TypingIndicator.tsx      # "..." loading animation
│   │
│   ├── bundle/                      # Results display
│   │   ├── BundleView.tsx           # Results container + print button
│   │   ├── GatewayCard.tsx          # Gateway entitlement with "START HERE" badge
│   │   ├── CascadeList.tsx          # Cascaded entitlements grouped by gateway
│   │   ├── EntitlementCard.tsx      # Individual entitlement card
│   │   ├── ConflictCard.tsx         # Mutual exclusion with recommendation
│   │   ├── TotalValueBanner.tsx     # "£X–£Y/year" summary
│   │   ├── ApplyLink.tsx            # GOV.UK application links
│   │   ├── ConfidenceBadge.tsx      # Likely / Possible / Worth checking
│   │   ├── DifficultyBadge.tsx      # Automatic / Easy / Complex
│   │   ├── ValueBadge.tsx           # Estimated annual value
│   │   └── WhatYouNeed.tsx          # Required documents checklist
│   │
│   ├── action-plan/                 # Week-by-week action plan
│   │   ├── ActionPlanView.tsx
│   │   ├── ActionPlanWeek.tsx
│   │   └── ActionItem.tsx
│   │
│   ├── disclaimers/                 # Warnings and signposting
│   │   ├── PreResultsDisclaimer.tsx # "This is guidance, not formal advice"
│   │   ├── ResultsFooter.tsx        # Citizens Advice + GOV.UK links
│   │   └── StaleDataWarning.tsx     # Data freshness notice
│   │
│   └── shared/                      # Layout components
│       ├── Header.tsx               # Nav bar with About toggle
│       ├── WelcomeHero.tsx          # Landing screen with CTA
│       ├── AboutPanel.tsx           # How it works, privacy, limitations
│       ├── PrivacyBanner.tsx        # Privacy notice
│       └── OutOfScopeMessage.tsx    # Fallback for unsupported situations
│
├── engine/                          # Entitlement engine (deterministic)
│   ├── bundle-builder.ts            # Orchestrator: eligibility → values → cascade → conflicts → plan
│   ├── eligibility-rules.ts         # Rule map: 30+ entitlements with field-level checks
│   ├── cascade-resolver.ts          # Groups entitlements by gateway dependency
│   ├── conflict-resolver.ts         # Resolves mutually exclusive entitlements
│   ├── value-estimator.ts           # Calculates estimated annual values from benefit rates
│   └── state-machine.ts            # Conversation state reducer
│
├── services/                        # External integrations
│   ├── claude.ts                    # API client + response parser (XML tag extraction)
│   ├── claude-system-prompt.ts      # System prompt builder (role, rules, examples, context)
│   ├── message-extractor.ts         # Code-based fallback extraction (regex/keywords)
│   └── postcodes.ts                 # postcodes.io lookup for nation/local authority
│
├── hooks/
│   └── useConversation.ts           # Main hook: state, message handling, extraction, bundle building
│
├── types/
│   ├── person.ts                    # PersonData (25+ fields), ChildData, CaredForPerson
│   ├── entitlements.ts              # EntitlementBundle, CascadedGroup, ConflictResolution
│   └── conversation.ts              # SituationId, ConversationStage, Message, QuickReply
│
├── data/
│   ├── entitlements.json            # Master data model: 50+ entitlements, dependencies, conflicts
│   └── benefit-rates.json           # GOV.UK rates for 2025–26 tax year
│
└── utils/
    ├── format-currency.ts
    └── format-weekly-to-annual.ts

tests/
├── engine/                          # Unit tests
│   ├── bundle-builder.test.ts
│   ├── cascade-resolver.test.ts
│   └── conflict-resolver.test.ts
│
└── nova-eval/                       # LLM evaluation framework
    ├── run-eval.ts                  # Entry point: runs all scenarios, scores, reports
    ├── test-scenarios.ts            # 42 scenarios across 10 categories
    ├── bedrock-client.ts            # AWS Bedrock Converse API wrapper
    ├── scoring.ts                   # Field-by-field comparison + weighted scoring
    └── report.ts                    # Console table + JSON report generation

api/
└── chat.ts                          # Vercel serverless function (Claude API proxy)

dev-server.js                        # Local dev API proxy (loads .env.local)
```

## How the Engine Works

### Conversation Flow

The LLM handles situation classification and natural conversation. The system prompt instructs it to output structured XML tags alongside its conversational response:

```xml
<situation>ageing_parent, lost_job</situation>
<person_data>{"relationship_status": "couple_married", "employment_status": "unemployed"}</person_data>
<stage_transition>questions</stage_transition>
<quick_replies>[{"label": "Just me", "value": "Just me"}]</quick_replies>
```

The parser (`claude.ts`) extracts these tags via regex. A code-based fallback (`message-extractor.ts`) catches fields the LLM misses using deterministic pattern matching.

### Conversation Stages

| Stage | What happens |
|-------|-------------|
| `intake` | User describes situation. LLM classifies it and extracts initial data. |
| `questions` | LLM asks targeted follow-ups for missing fields (4–6 questions max). |
| `complete` | Enough data collected. Engine builds the entitlement bundle. |

### Entitlement Engine Pipeline

When the conversation reaches `complete`, `buildBundle()` runs:

1. **Eligibility check** — Run deterministic rules against PersonData for all 50+ entitlements
2. **Value estimation** — Calculate estimated annual value using GOV.UK benefit rates
3. **Cascade resolution** — Group entitlements by their gateway (what unlocks what)
4. **Conflict resolution** — Identify mutually exclusive pairs, recommend the better option
5. **Action plan** — Generate week-by-week steps ordered by priority and dependencies

### Eligibility Rules

Each entitlement has a deterministic rule checker in `eligibility-rules.ts`:

```typescript
universal_credit: (person) => {
  if (person.age < 18 || person.age >= SPA) return { eligible: false }
  if (person.household_capital >= 16000) return { eligible: false }
  if (person.income_band === 'under_25000') return { eligible: true, confidence: 'likely' }
  // ...
}
```

Rules check specific PersonData fields and return a confidence tier:
- **likely** — strong match (income clearly below threshold)
- **possible** — probable but needs verification
- **worth_checking** — data incomplete, but worth applying

### Gateway Cascade

The cascade is what makes CitizenFirst unique. Example:

```
Pension Credit (GATEWAY — claim first)
  ├── Council Tax Reduction (full — automatic)
  ├── Housing Benefit (if renting)
  ├── Warm Home Discount (£150/year — automatic)
  ├── Free prescriptions
  ├── Free dental treatment
  └── Free TV licence (if 75+)
```

Claiming Pension Credit first can unlock £3,000–5,000+ in additional entitlements that the person would otherwise miss.

## Data Model

### entitlements.json

The master data file (41KB) defines:

- **50+ entitlements** with eligibility rules, application methods, GOV.UK URLs, difficulty ratings
- **Dependency edges** — which entitlements unlock which (gateway, strengthens, qualifies)
- **Conflict edges** — mutually exclusive pairs with resolution logic
- **10+ situations** with trigger phrases and primary/secondary entitlements
- **Claiming difficulty** ratings: automatic, easy, moderate, complex, adversarial

### benefit-rates.json

Current GOV.UK rates for the 2025–26 tax year:

- Attendance Allowance: £73.90–£110.40/week
- Pension Credit: £227.10/week (single), £346.60/week (couple)
- Carer's Allowance: £83.30/week
- Universal Credit: £316.98–£393.45/month (standard allowance)
- Child Benefit: £26.05/week (first child)
- State Pension age: 66

## LLM Evaluation

A comprehensive test suite evaluates LLM accuracy for structured extraction.

### Running the Eval

```bash
# Requires AWS credentials with Bedrock access
npx tsx tests/nova-eval/run-eval.ts
```

### Test Categories (42 scenarios)

| Category | Count | Tests |
|----------|-------|-------|
| A: Intake extraction | 6 | Complex multi-situation, single situations, varying detail levels |
| B: Income band mapping | 5 | "twelve grand", "£25,000", "minimum wage 20hrs", "just JSA" |
| C: Implicit inference | 6 | "my wife" → married, "mortgage" → housing tenure, "redundant" → unemployed |
| D: Multi-turn conversation | 5 | Full 3-turn flows with accumulated state |
| E: XML format compliance | All | Every scenario validates parseability |
| F: Edge cases | 4 | Separation, vague input, contradictions, very long messages |
| G: Health / disability | 6 | MS, wheelchair+PIP, depression, dementia carer, chronic pain, child cerebral palsy |
| H: Bereavement | 3 | Young widow with children, elderly widower, carer bereavement |
| I: Separation | 3 | Divorce with kids, DV + no income, joint mortgage |
| J: Mixed / novel | 4 | Homeless + addiction, early retirement, student + baby, business failure |

### Scoring

Each scenario is scored on:
- **XML validity** (20%) — parseable by existing parser
- **Situation classification** (20%) — correct situation IDs
- **Field accuracy** (30%) — field-by-field comparison with expected values
- **Stage transition** (10%) — correct conversation stage
- **Conversational text** (20%) — non-empty, contains expected content

Pass threshold: 80% overall, no scenario below 60%.

### Results (Nova Micro)

| Metric | Model-only | Model + code fallback |
|--------|-----------|----------------------|
| Overall score | 85.9% | **95.0%** |
| Scenarios passed | 42/42 | 42/42 |
| Avg latency | 810ms | 810ms |
| Est. cost/conversation | $0.001 | $0.001 |
| Conversations per dollar | ~1,013 | ~1,013 |

The code-based extraction fallback adds +9.1 percentage points at zero additional cost or latency. Code extractors cover health/disability detection, mobility assessment, bereavement/widowed status, and disability benefit level (PIP/DLA/AA).

## Deployment

### Vercel

The project is configured for Vercel deployment:

```bash
vercel deploy
```

- `vercel.json` handles SPA routing and API rewrites
- `api/chat.ts` is the serverless function for Claude API proxying
- Set `ANTHROPIC_API_KEY` in Vercel environment variables

### Build Output

```bash
npm run build
# dist/index.html        0.56 kB
# dist/assets/index.css  16.30 kB
# dist/assets/index.js   292.14 kB (89 kB gzipped)
```

## Accessibility

- Skip-to-content link
- Semantic HTML throughout (header, main, footer, nav)
- ARIA labels on all interactive elements
- `aria-expanded` on toggles, `aria-controls` for panels
- Focus-visible styles on all focusable elements
- Touch targets minimum 44px
- Colour contrast WCAG 2.1 AA compliant
- Print stylesheet (hide UI chrome, show results only)

## Privacy

- No data is stored anywhere — conversation exists only in browser memory
- No accounts, no cookies, no tracking, no analytics
- Session disappears when you close the tab
- API proxy only forwards messages to Claude — nothing is logged
- Postcode lookup uses postcodes.io (public, no auth required)

## Limitations

- **Guidance, not advice** — results are estimates, not formal benefits advice
- **England-focused** — Scotland, Wales, Northern Ireland have different schemes (partially supported)
- **No real-time data** — benefit rates must be manually updated each tax year
- **Council Tax Support varies** — 300+ local schemes, we can only say "apply to your council"
- **No application submission** — we show what to claim and link to GOV.UK, but can't submit for you

## Design Decisions

**Why conversational?** People don't know benefit names. They know "my mum can't cope" and "I've lost my job". Starting from the person's situation, not the benefit system, is the whole point.

**Why no backend?** Privacy-first. No data stored means no GDPR liability, no breach risk, no compliance overhead. The trade-off is no session persistence — acceptable for V0.1.

**Why deterministic rules + LLM?** The LLM handles the fuzzy parts (understanding "my wife earns about 12 grand" means couple_married + gross_annual_income: 12000). The rules engine handles the precise parts (income < £16,000 + children = UC eligible). Neither could do both well alone.

**Why gateway cascade?** Because it's the highest-value insight we can give someone. "Claim Pension Credit first — it unlocks 6 other things worth £5,000/year" is worth more than a flat list of 20 benefits.

## Spec Documents

Detailed design documentation in the project root:

| Document | Contents |
|----------|----------|
| `entitlement-engine.md` | Core concept, problem statement, V0.1 scope |
| `technical-build-spec.md` | Architecture, components, implementation details |
| `conversation-flow-spec.md` | Intake flow, conversation stages, branching logic |
| `accuracy-and-liability.md` | Disclaimers, error handling, duty of care |
| `research-landscape.md` | Competitive analysis, prior art, positioning |
| `build_plan.md` | Development roadmap |

## License

Private. Not open source.
