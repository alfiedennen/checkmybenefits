# Check My Benefits

A conversational web app that helps UK citizens discover what benefits and support they're entitled to. Describe your situation in plain English, answer a few questions, and get a prioritised bundle of entitlements — including what to claim first and what it unlocks.

**Live:** [checkmybenefits.uk](https://checkmybenefits.uk)

**Status:** V1.0 — 75 entitlements across England, Wales and Scotland. 48 eligibility rules. 398 deterministic tests + 105 single-turn + 16 multi-turn AI evals. Auto-updating benefit rates. Bedrock Guardrails for content safety.

## What It Does

Most people don't know what they're entitled to. Government websites list hundreds of benefits but don't tell you which ones apply to *your* situation, or that claiming one benefit can unlock three others. Check My Benefits fixes this.

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

Any life situation is supported. The engine evaluates all 75 entitlements across DWP, HMRC, NHS, DfE, DfT, MoJ, and devolved nation schemes (Wales, Scotland) based on the user's data. Common situations include:

| Situation | Example trigger | Key entitlements |
|-----------|----------------|-----------------|
| Ageing parent | "My mum can't cope" | Attendance Allowance, Pension Credit, Carer's Allowance, Council Tax Reduction |
| New baby | "We're expecting a baby" | Child Benefit, Maternity Allowance, Healthy Start, Tax-Free Childcare |
| Child struggling at school | "My child has ADHD" | DLA (Child), EHCP Assessment, Free School Meals |
| Lost job | "I've been made redundant" | Universal Credit, Council Tax Support, Social Tariff Broadband, Warm Home Discount |
| Health condition / disability | "I have MS and can't work" | PIP, Free NHS Prescriptions, Blue Badge, Motability, VED Exemption, UC |
| Bereavement | "My husband died" | Bereavement Support Payment, Funeral Expenses Payment, UC |
| Separation | "Going through a divorce" | UC, Council Tax Support, Free School Meals |

Multiple situations can overlap — a combined bundle is produced across all.

## Architecture

```
User message
  │
  ▼
┌─────────────────────────────┐
│  Amazon Nova Lite (Bedrock) │  Situation classification, empathetic conversation,
│  + Bedrock Guardrails        │  structured data extraction from natural language
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
└─────────────────────────────┘
```

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 SPA, mobile-first, no backend storage |
| AI | Amazon Nova Lite via AWS Bedrock Converse API |
| Content safety | Bedrock Guardrails (content filters, PII blocking, topic denial) |
| Data | Static JSON entitlement model + GOV.UK benefit rates (auto-updated) |
| Infrastructure | Terraform — S3, CloudFront, Lambda, API Gateway, Route 53 |
| CI/CD | GitHub Actions — build, deploy, rate auto-update, DWP feed monitor |
| Privacy | No data stored, session only, no accounts, no tracking, no cookies |

## Infrastructure

All infrastructure is defined in Terraform (`infrastructure/`):

```
Route 53 (DNS)
  └── CloudFront (CDN + SSL)
        ├── S3 (static site)
        └── API Gateway → Lambda (chat API → Bedrock Nova Lite)
                                    └── Bedrock Guardrail

SNS Topic → Email alerts
  ├── AWS Budget ($50/month Bedrock)
  └── CloudWatch Alarm (invocation spike)
```

### Bedrock Guardrails

The chat API is protected by a Bedrock Guardrail that runs server-side, filtering input before it reaches the model and output before it reaches the user:

- **Content filters** — HATE, INSULTS, SEXUAL, VIOLENCE, MISCONDUCT (HIGH), PROMPT_ATTACK (HIGH input)
- **Denied topics** — investment advice, medical diagnosis, legal advice
- **PII blocking** — NI numbers, credit/debit card numbers, NHS numbers
- **Profanity filter** — AWS managed word list

### Cost Monitoring

Bedrock spend is tracked with a $50/month budget and email alerts:

- **AWS Budget** — filtered to Amazon Bedrock, alerts at 50% ($25), 80% ($40), 100% ($50)
- **CloudWatch alarm** — Lambda invocation count threshold (fast-reacting proxy, since Budgets data lags 12–24hrs)
- **SNS notifications** — email alerts to the project owner

### GitHub Actions Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `deploy.yml` | Push to `main` | Build site, sync to S3, invalidate CloudFront, deploy Lambda |
| `eval.yml` | Weekly + manual | Run 105 single-turn + 16 multi-turn AI evals against Bedrock |
| `update-rates.yml` | Weekly cron | Fetch GOV.UK benefit rates, validate, commit if changed |
| `check-dwp-feed.yml` | Daily cron | Monitor DWP Atom feed for rate publications, trigger update |

### Rate Auto-Update Pipeline

Benefit rates are automatically kept current:

1. **Weekly cron** — `scripts/update-rates.ts` fetches GOV.UK Content API, parses HTML tables for 31 rate values
2. **DWP feed monitor** — `scripts/check-dwp-feed.ts` watches for new rate publications via Atom feed
3. **Validation** — `scripts/validate-rates.ts` checks parsed values against expected ranges
4. **Commit** — If rates changed and pass validation, auto-commits to the repo

GOV.UK Content API patterns: no auth needed, 10 req/s limit. Uses `cheerio` for HTML table parsing.

## Getting Started

### Prerequisites

- Node.js 20+
- For local dev with Claude: an Anthropic API key (`sk-ant-...`)
- For production: AWS credentials with Bedrock, S3, CloudFront, Lambda access

### Setup

```bash
# Install dependencies
npm install

# Ensure AWS credentials are configured (for Bedrock Nova Lite)
# Uses ~/.aws/credentials or AWS_PROFILE environment variable

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
| `npm test` | Run unit tests (Vitest, 398 tests) |
| `npm run test:watch` | Watch mode tests |
| `npm run eval` | Run 105 single-turn AI eval scenarios (requires Bedrock) |
| `npm run eval:multi-turn` | Run 16 multi-turn AI eval scenarios (requires Bedrock) |
| `npm run update-rates` | Manually fetch latest GOV.UK benefit rates |
| `npm run build-imd` | Rebuild IMD deprivation lookup from source data |

## Project Structure

```
src/
├── components/
│   ├── conversation/           # Chat UI
│   │   ├── ConversationView.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── TextInput.tsx
│   │   ├── QuickReplyButtons.tsx
│   │   └── TypingIndicator.tsx
│   ├── bundle/                 # Results display
│   │   ├── BundleView.tsx
│   │   ├── GatewayCard.tsx
│   │   ├── CascadeList.tsx
│   │   ├── EntitlementCard.tsx
│   │   ├── ConflictCard.tsx
│   │   ├── TotalValueBanner.tsx
│   │   ├── ApplyLink.tsx
│   │   ├── ConfidenceBadge.tsx
│   │   ├── DifficultyBadge.tsx
│   │   ├── ValueBadge.tsx
│   │   └── WhatYouNeed.tsx
│   ├── action-plan/            # Week-by-week action plan
│   │   ├── ActionPlanView.tsx
│   │   ├── ActionPlanWeek.tsx
│   │   └── ActionItem.tsx
│   ├── disclaimers/
│   │   ├── PreResultsDisclaimer.tsx
│   │   ├── ResultsFooter.tsx
│   │   └── StaleDataWarning.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── WelcomeHero.tsx
│       ├── AboutPanel.tsx
│       └── PrivacyBanner.tsx
│
├── engine/                     # Entitlement engine (deterministic)
│   ├── bundle-builder.ts       # Orchestrator: eligibility → values → cascade → conflicts → plan
│   ├── eligibility-rules.ts    # 48 rules covering 75 entitlements
│   ├── cascade-resolver.ts     # Groups entitlements by gateway dependency
│   ├── conflict-resolver.ts    # Resolves mutually exclusive entitlements
│   ├── value-estimator.ts      # Calculates estimated annual values from benefit rates
│   ├── critical-fields.ts      # Gate check: 5 required fields before bundle build
│   └── state-machine.ts        # Conversation state reducer
│
├── services/
│   ├── ai.ts                   # API client + response parser (XML tag extraction)
│   ├── system-prompt.ts        # System prompt builder (completion gate, stage instructions)
│   ├── message-extractor.ts    # Code-based fallback extraction (regex/keywords)
│   ├── postcodes.ts            # postcodes.io lookup (full + outcode/partial postcodes)
│   ├── deprivation.ts          # IMD deprivation decile from LSOA
│   └── policyengine.ts         # PolicyEngine integration (wired in, dormant)
│
├── hooks/
│   ├── useConversation.ts      # Main hook: state, messages, extraction, bundle building
│   └── usePostcode.ts          # Postcode lookup hook
│
├── types/
│   ├── person.ts               # PersonData (30+ fields), ChildData, CaredForPerson
│   ├── entitlements.ts         # EntitlementBundle, CascadedGroup, ConflictResolution
│   ├── conversation.ts         # SituationId, ConversationStage, Message, QuickReply
│   └── policyengine.ts         # PE API types
│
├── data/
│   ├── entitlements.json       # 75 entitlements (England/Wales/Scotland), 45 dependency edges, 5 conflicts
│   ├── benefit-rates.json      # GOV.UK rates for 2025–26 (auto-updated)
│   ├── imd-lookup.json         # 32K LSOA → deprivation decile (IMD 2019)
│   └── quick-replies.ts        # Suggested quick reply options
│
└── utils/
    ├── format-currency.ts
    └── format-weekly-to-annual.ts

tests/
├── engine/
│   ├── bundle-builder.test.ts
│   ├── cascade-resolver.test.ts
│   ├── conflict-resolver.test.ts
│   ├── validate-rates.test.ts
│   ├── deprivation.test.ts
│   ├── postcodes.test.ts           # Full + outcode/partial postcode tests
│   ├── conversation-replay.test.ts # 12 multi-turn conversation replays (deterministic)
│   ├── policyengine-integration.test.ts
│   ├── persona-scenarios.test.ts
│   └── entitlement-matrix.test.ts  # 134 matrix tests (all 75 entitlements × 3 nations)
├── services/
│   ├── message-extractor.test.ts
│   └── system-prompt.test.ts       # 31 system prompt guardrail tests
├── nova-eval/                      # LLM evaluation framework
│   ├── run-eval.ts                 # Single-turn eval runner
│   ├── run-multi-turn-eval.ts      # Multi-turn eval runner (Bedrock conversations)
│   ├── test-scenarios.ts           # 105 single-turn scenarios across 21 categories
│   ├── multi-turn-scenarios.ts     # 16 multi-turn conversation scenarios
│   ├── bedrock-client.ts
│   ├── scoring.ts
│   └── report.ts
└── REAL-WORLD-RUBRIC.md            # Test layer documentation

scripts/
├── update-rates.ts             # Fetch + parse GOV.UK Content API rates
├── parse-gov-uk-rates.ts       # HTML table parser for rate pages
├── validate-rates.ts           # Range validation for parsed rates
├── check-dwp-feed.ts           # DWP Atom feed monitor
└── build-imd-lookup.ts         # Build LSOA → IMD decile lookup

infrastructure/
├── main.tf                     # S3, CloudFront, Lambda, API Gateway, Bedrock Guardrail, Cost Monitoring
├── provider.tf                 # AWS providers (eu-west-2 + us-east-1 for ACM)
├── variables.tf
└── outputs.tf

lambda/chat/
└── index.mjs                   # Lambda handler: Bedrock Converse API + Guardrail

.github/workflows/
├── deploy.yml                  # Build + deploy on push to main
├── eval.yml                    # Weekly single-turn + multi-turn AI evals
├── update-rates.yml            # Weekly benefit rate auto-update
└── check-dwp-feed.yml          # Daily DWP Atom feed monitor
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

The parser (`ai.ts`) extracts these tags via regex. A code-based fallback (`message-extractor.ts`) catches fields the LLM misses using deterministic pattern matching.

### Conversation Stages

| Stage | What happens |
|-------|-------------|
| `intake` | User describes situation. LLM classifies it and extracts initial data. |
| `questions` | LLM asks targeted follow-ups for missing fields (4–6 questions max). |
| `complete` | Enough data collected. Engine builds the entitlement bundle. |

### Entitlement Engine Pipeline

When the conversation reaches `complete`, `buildBundle()` runs:

1. **Eligibility check** — Run deterministic rules against PersonData for all 75 entitlements (filtered by nation)
2. **Value estimation** — Calculate estimated annual value using GOV.UK benefit rates
3. **Cascade resolution** — Group entitlements by their gateway (what unlocks what)
4. **Conflict resolution** — Identify mutually exclusive pairs, recommend the better option
5. **Action plan** — Generate week-by-week steps ordered by priority and dependencies

### Gateway Cascade

The cascade is the core value proposition. Example:

```
Pension Credit (GATEWAY — claim first)
  ├── Council Tax Reduction (full — automatic)
  ├── Housing Benefit (if renting)
  ├── Warm Home Discount (£150/year — automatic)
  ├── Free NHS Prescriptions
  ├── Free NHS Dental Treatment
  ├── Free NHS Sight Tests
  ├── NHS Travel Cost Refunds
  ├── Cold Weather Payment
  └── Free TV licence (if 75+)
```

Claiming Pension Credit first can unlock £3,000–5,000+ in additional entitlements that the person would otherwise miss.

## Data Model

### entitlements.json

The master data file defines:

- **75 entitlements** with eligibility rules, application methods, GOV.UK URLs, difficulty ratings, nation availability
- **45 dependency edges** — which entitlements unlock which (gateway, strengthens, qualifies)
- **5 conflict edges** — mutually exclusive pairs with resolution logic
- **10+ situations** with trigger phrases and primary/secondary entitlements
- **Claiming difficulty** ratings: automatic, easy, moderate, complex, adversarial

### benefit-rates.json

Current GOV.UK rates (auto-updated weekly). Covers 31+ rate values across all major benefits including Welsh and Scottish schemes.

### imd-lookup.json

32,844 LSOA to deprivation decile mappings from the Index of Multiple Deprivation 2019. Used for area-based eligibility (e.g., ECO4, Sure Start).

## Testing

The project has four test layers providing comprehensive coverage of both the deterministic engine and AI extraction quality. See [`TESTING.md`](TESTING.md) for full methodology, scenario details, and findings.

| Layer | Count | What it tests | Runs |
|-------|-------|---------------|------|
| Deterministic tests (Vitest) | 398 | Engine, extraction, postcodes, prompt guardrails, entitlement matrix | Every push |
| Single-turn AI evals | 105 | LLM extraction quality across 21 categories | Weekly + manual |
| Multi-turn AI evals | 16 | Full AI conversation management (field collection, gate compliance) | Weekly + manual |
| Guardrail evals | 30 | Off-topic redirection + on-topic engagement (Bedrock) | Manual |

### Key Numbers

| Metric | Value |
|--------|-------|
| Entitlements tested | 75/75 (all directly tested via matrix) |
| Nations tested | England, Wales, Scotland (all entitlements × all nations) |
| Deterministic test runtime | <1s (no API calls) |
| Single-turn AI eval score | **96.1%** (105/105 pass, model + code fallback) |
| Multi-turn AI eval score | **96.2%** (16/16 pass) |
| Avg AI eval latency | 750ms |
| Est. cost per conversation | ~$0.001 |

### Completion Gate

The system uses a dual-layer gate to prevent premature results:

1. **AI-level gate** — System prompt requires 5 fields (age, employment_status, income_band, housing_tenure, postcode) before transitioning to complete
2. **Code-level gate** — `critical-fields.ts` blocks the `complete` transition if any field is missing, regardless of what the AI says

### Running Tests

```bash
npm test                  # 398 deterministic tests (Vitest)
npm run eval              # 105 single-turn AI eval scenarios (requires Bedrock)
npm run eval:multi-turn   # 16 multi-turn AI eval scenarios (requires Bedrock)
```

## Deployment

### Production (AWS)

Infrastructure is managed with Terraform. Deployment is automated via GitHub Actions on push to `main`.

```bash
# First-time infrastructure setup
cd infrastructure
terraform init
terraform apply

# Subsequent deploys happen automatically via GitHub Actions
git push origin main
```

**Required GitHub Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `CLOUDFRONT_DISTRIBUTION_ID`

### Local Development

```bash
npm run dev:full
```

Uses the local API proxy (`dev-server.js`) which forwards to the Anthropic Claude API (Sonnet) using the key in `.env.local`. Production uses Nova Lite via Bedrock.

## Accessibility

- Skip-to-content link
- Semantic HTML throughout (header, main, footer, nav)
- ARIA labels on all interactive elements
- Focus-visible styles on all focusable elements
- Touch targets minimum 44px
- Colour contrast WCAG 2.1 AA compliant
- Print stylesheet (hide UI chrome, show results only)

## Privacy

- No data is stored anywhere — conversation exists only in browser memory
- No accounts, no cookies, no tracking, no analytics
- Session disappears when you close the tab
- PII (NI numbers, card numbers, NHS numbers) blocked by Bedrock Guardrails before reaching the model
- Postcode lookup uses postcodes.io (public, no auth required) — accepts full or partial postcodes

## Limitations

- **Guidance, not advice** — results are estimates, not formal benefits advice
- **England, Wales, Scotland** — Northern Ireland has separate schemes (not yet covered)
- **Council Tax Support varies** — 300+ local schemes, we can only say "apply to your council"
- **No application submission** — we show what to claim and link to GOV.UK, but can't submit for you

## Design Decisions

**Why conversational?** People don't know benefit names. They know "my mum can't cope" and "I've lost my job". Starting from the person's situation, not the benefit system, is the whole point.

**Why no backend?** Privacy-first. No data stored means no GDPR liability, no breach risk, no compliance overhead.

**Why deterministic rules + LLM?** The LLM handles the fuzzy parts (understanding "my wife earns about 12 grand" means couple + income ~£12k). The rules engine handles the precise parts (income < £16,000 + children = UC eligible). Neither could do both well alone.

**Why gateway cascade?** Because it's the highest-value insight we can give someone. "Claim Pension Credit first — it unlocks 6 other things worth £5,000/year" is worth more than a flat list of 20 benefits.

**Why Nova Lite over Claude?** At ~$0.002/conversation, it's 10–50x cheaper than Claude Sonnet for this use case. Nova Micro was even cheaper but couldn't reliably follow the structured XML output format. Nova Lite handles it well, and the code-based extraction fallback compensates for any remaining weaknesses, bringing accuracy to 96%.

## License

[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) — Public Domain Dedication.
