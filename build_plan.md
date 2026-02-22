# Build Plan: Check My Benefits Entitlement Engine V0.1

## Context

We're building the Situation Screener — a conversational React web app where UK citizens describe their life situation and receive a prioritised bundle of entitlements with gateway cascade ordering. This is a standalone product using public APIs and open data only. The gateway cascade ("claim X first, it unlocks Y and Z") is the core differentiator.

**Constraints:** Public APIs only, PolicyEngine UK for calculations, Claude API for conversation, Vercel hosting, plain CSS, no backend beyond a thin API proxy.

---

## Architecture

```
User describes situation
  → Claude classifies situation + asks questions
    → Answers mapped to PolicyEngine household input
      → PolicyEngine calculates means-tested benefits (UC, PC, Child Benefit, etc.)
        → Claude + static data model handle non-computable entitlements (EHCP, DLA, social tariffs)
          → cascade-resolver orders by gateway dependencies
            → Bundle displayed with cascade visualisation + action plan
```

**Three layers:**
1. **Claude API** (via Vercel serverless proxy) — conversation, classification, fuzzy reasoning
2. **PolicyEngine UK API** (direct from browser, CORS open, no auth) — deterministic benefit calculations
3. **Static entitlement data model** (JSON, build-time) — dependency edges, cascade logic, situation taxonomy

---

## Folder Structure

```
checkmybenefits/
├── api/
│   └── chat.ts                     # Vercel serverless function: Claude API proxy
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css                     # Global styles, CSS custom properties
│   ├── types/
│   │   ├── entitlements.ts         # EntitlementBundle, EntitlementResult, CascadedGroup
│   │   ├── conversation.ts         # ConversationState, Message, SituationId
│   │   ├── policyengine.ts         # API request/response types
│   │   └── person.ts              # PersonData, enums (HousingTenure, IncomeBand, etc.)
│   ├── data/
│   │   ├── entitlements.json       # Copy of entitlement-engine-data-model.json
│   │   ├── benefit-rates.json      # Rates with tax_year, source, last_verified
│   │   └── quick-replies.ts        # QuickReply option sets
│   ├── engine/
│   │   ├── cascade-resolver.ts     # Walk dependency edges → CascadedGroup[]
│   │   ├── conflict-resolver.ts    # Walk conflict edges → ConflictResolution[]
│   │   ├── bundle-builder.ts       # Orchestrator: eligibility + cascade + conflicts → EntitlementBundle
│   │   ├── value-estimator.ts      # Calculate estimated value ranges from rates
│   │   ├── eligibility-rules.ts    # Deterministic rule checks + confidence assignment
│   │   └── state-machine.ts        # Conversation stage reducer
│   ├── services/
│   │   ├── claude.ts               # Claude API client + response parser
│   │   ├── claude-system-prompt.ts # System prompt builder (the critical file)
│   │   ├── policyengine.ts         # PolicyEngine API client + household mapper
│   │   └── postcodes.ts            # postcodes.io lookup
│   ├── hooks/
│   │   ├── useConversation.ts      # Main state hook: messages, stages, bundle
│   │   ├── usePolicyEngine.ts      # Calculation hook
│   │   └── usePostcode.ts          # Postcode lookup with debounce
│   ├── components/
│   │   ├── conversation/
│   │   │   ├── ConversationView.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── QuickReplyButtons.tsx
│   │   │   ├── TextInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── bundle/
│   │   │   ├── BundleView.tsx
│   │   │   ├── TotalValueBanner.tsx
│   │   │   ├── GatewayCard.tsx      # "START HERE" card
│   │   │   ├── CascadeList.tsx      # Indented tree with connecting lines
│   │   │   ├── EntitlementCard.tsx
│   │   │   ├── ConfidenceBadge.tsx
│   │   │   ├── DifficultyBadge.tsx
│   │   │   ├── ValueBadge.tsx
│   │   │   ├── WhatYouNeed.tsx
│   │   │   ├── ConflictCard.tsx
│   │   │   └── ApplyLink.tsx
│   │   ├── action-plan/
│   │   │   ├── ActionPlanView.tsx
│   │   │   ├── ActionPlanWeek.tsx
│   │   │   └── ActionItem.tsx
│   │   ├── disclaimers/
│   │   │   ├── PreResultsDisclaimer.tsx
│   │   │   ├── ResultsFooter.tsx
│   │   │   └── StaleDataWarning.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── PrivacyBanner.tsx
│   │       └── OutOfScopeMessage.tsx
│   └── utils/
│       ├── format-currency.ts
│       └── format-weekly-to-annual.ts
├── tests/
│   ├── engine/
│   │   ├── cascade-resolver.test.ts
│   │   ├── conflict-resolver.test.ts
│   │   └── bundle-builder.test.ts
│   └── scenarios/
│       ├── ageing-parent.test.ts
│       ├── new-baby.test.ts
│       ├── child-struggling.test.ts
│       └── lost-job.test.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── vercel.json
└── .env.local                      # ANTHROPIC_API_KEY (never committed)
```

---

## Phase 1: Static Prototype (no AI)

**Goal:** Build the full UI with hard-coded ageing parent data. Validate cascade rendering and component architecture.

### Step 1: Scaffold
- `npm create vite@latest . -- --template react-ts`
- Install deps: `react-markdown` only
- Dev deps: `vitest`, `@testing-library/react`
- Configure `vite.config.ts` with dev proxy for `/api`
- Set up CSS custom properties in `App.css`

### Step 2: Types (4 files)
- `types/person.ts` — PersonData, enums from data model's person_schema
- `types/conversation.ts` — ConversationState, Message, SituationId, QuickReply
- `types/entitlements.ts` — EntitlementBundle, EntitlementResult, CascadedGroup, ConflictResolution, ActionPlanStep
- `types/policyengine.ts` — PolicyEngine request/response shapes

### Step 3: Data files
- `data/entitlements.json` — copy of entitlement-engine-data-model.json
- `data/benefit-rates.json` — extracted rates with tax_year, source fields
- `data/quick-replies.ts` — typed QuickReply option sets

### Step 4: Engine logic
- `engine/cascade-resolver.ts` — **the core algorithm**: takes eligible entitlement IDs + dependency edges → produces gateway_entitlements[], cascaded_entitlements[] (grouped by gateway), independent_entitlements[]
- `engine/conflict-resolver.ts` — walks conflict edges, produces ConflictResolution with recommendation
- `engine/value-estimator.ts` — calculates estimated ranges from rates + person data
- `engine/eligibility-rules.ts` — deterministic rule checks with confidence tier assignment
- `engine/bundle-builder.ts` — orchestrator combining all the above into EntitlementBundle
- `engine/state-machine.ts` — conversation stage reducer

### Step 5: Tests for engine logic
- `tests/engine/cascade-resolver.test.ts` — test with ageing parent cascade (AA → PC → CT Reduction)
- `tests/engine/conflict-resolver.test.ts` — test TFC vs UC, PC vs UC conflicts
- `tests/engine/bundle-builder.test.ts` — full bundle assembly for ageing parent scenario

### Step 6: Utils + shared components
- `utils/format-currency.ts`, `utils/format-weekly-to-annual.ts`
- `components/shared/Header.tsx`, `PrivacyBanner.tsx`, `OutOfScopeMessage.tsx`

### Step 7: Bundle display components (hard-coded ageing parent data)
Build in order: ValueBadge → DifficultyBadge → ConfidenceBadge → ApplyLink → WhatYouNeed → EntitlementCard → CascadeList → GatewayCard → ConflictCard → TotalValueBanner → BundleView

**CascadeList** is the key visual component — indented tree with CSS border-left connecting lines showing what each gateway unlocks.

**GatewayCard** gets distinct treatment: green left border, "START HERE" badge, why_this_matters text prominently displayed.

### Step 8: Disclaimer components
- `PreResultsDisclaimer.tsx` — exact text from accuracy-and-liability.md
- `ResultsFooter.tsx` — signposting to Citizens Advice, Turn2us, entitledto, IPSEA
- `StaleDataWarning.tsx` — checks tax_year against current date

### Step 9: Action plan components
- ActionItem → ActionPlanWeek → ActionPlanView

### Step 10: Conversation shell (UI only, no API)
- MessageBubble, QuickReplyButtons, TextInput, TypingIndicator
- ConversationView with hard-coded ageing parent conversation

### Step 11: App composition
- App.tsx renders Header, PrivacyBanner, ConversationView
- BundleView + ActionPlanView render inline below conversation when results ready

---

## Phase 2: Conversational Flow (with AI)

### Step 1: Claude proxy
- `api/chat.ts` — Vercel serverless function, reads ANTHROPIC_API_KEY from env, forwards to Claude API
- `vercel.json` — route config

### Step 2: Claude service
- `services/claude.ts` — sendMessage(), parseClaudeResponse() (extract XML tags: `<entitlement_bundle>`, `<quick_replies>`, `<situation>`, `<person_data>`, `<stage_transition>`)
- `services/claude-system-prompt.ts` — **the most critical file**: 8-section system prompt with entitlement data, rates, conversation rules, stage-specific instructions, tone rules, output format spec. Includes one full example (ageing parent) for reliability.

### Step 3: PolicyEngine service
- `services/policyengine.ts` — mapConversationToHousehold() converts conversation answers to API input format, calculateBenefits() calls /uk/calculate, parseCalculationResults() extracts annual GBP amounts
- Key mapping: income bands → midpoint estimates, housing tenure → PE enum, postcode region → PE region

### Step 4: Postcodes service
- `services/postcodes.ts` — lookupPostcode() returns admin_district (council), region, country

### Step 5: Hooks
- `hooks/useConversation.ts` — main state hook using useReducer with state-machine. Handles: add user message → send to Claude → parse response → call PolicyEngine if at Stage 4 → merge calculated values into bundle → dispatch state updates
- `hooks/usePolicyEngine.ts` — wraps policyengine service with loading/error state
- `hooks/usePostcode.ts` — wraps postcodes service with debounce

### Step 6: Wire up ConversationView
- Remove hard-coded messages, connect to useConversation hook
- TextInput → handleUserMessage, QuickReplyButtons → handleQuickReply
- TypingIndicator shown while loading
- BundleView renders inline when state.bundle is populated

### Step 7: Integration test all 4 situations
- Ageing parent: AA gateway → PC cascade → CA for carer
- New baby: Child Benefit, SMP/MA, TFC vs UC conflict card
- Child struggling: EHCP + DLA + CA cascade
- Lost job: UC urgent gateway, time-critical action plan

---

## Phase 3: Polish

1. **Sensitivity handling** — slower pace for sensitive situations (1 question/turn)
2. **Compound situations** — merge bundles when multiple situations detected
3. **"Already claiming" handling** — if user has PIP, show what PIP unlocks that they haven't claimed
4. **Print/export** — window.print() with print CSS
5. **Accessibility** — WCAG 2.1 AA: keyboard nav, ARIA labels, aria-live for messages, contrast, text resize
6. **Error handling** — Claude timeout → signposting fallback, PolicyEngine failure → estimated ranges, postcodes failure → manual council input

---

## Critical Path

```
Types → Data files → Engine logic (cascade-resolver is the key) → Tests
  → Bundle display components (can use hard-coded data while Claude work happens)

Types → Claude proxy → Claude service → System prompt → useConversation hook
  → Wire up ConversationView → Integration tests

PolicyEngine service runs parallel to Claude work (not on critical path —
app works with estimated ranges if PE isn't ready)
```

**Start with:** Scaffold + Types + Engine logic + Bundle components (Phase 1)
**Then:** Claude integration + PolicyEngine integration (Phase 2, parallel tracks)
**Finally:** Polish (Phase 3)

---

## Verification

### Phase 1 verification
- Hard-coded ageing parent bundle renders correctly with cascade tree
- All engine tests pass (cascade-resolver, conflict-resolver, bundle-builder)
- Mobile responsive at 320px, 375px, 768px viewpoints
- Disclaimer text matches accuracy-and-liability.md exactly

### Phase 2 verification
- Full conversation flow for all 4 situations end-to-end
- PolicyEngine returns calculated values that appear in bundle
- Out-of-scope situations get graceful fallback message
- Claude response parsing handles malformed/missing tags gracefully

### Phase 3 verification
- Print output is clean and includes all disclaimers
- Screen reader can navigate full flow (VoiceOver/NVDA)
- All interactive elements keyboard accessible
- API failures degrade gracefully without crash

---

## Key files from existing docs
- `entitlement-engine-data-model.json` — entitlement definitions, dependency edges, situation taxonomy
- `conversation-flow-spec.md` — 6-stage flow, question branches, tone rules
- `technical-build-spec.md` — TypeScript interfaces, component tree, quick replies
- `accuracy-and-liability.md` — confidence tiers, disclaimer text, tone rules
- `entitlement-engine.md` — cascade examples, claiming order sequences
