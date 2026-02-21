# Technical Build Specification

## Entitlement Engine V0.1 — The Situation Screener

---

## Architecture Overview

### What we're building

A conversational web application where a citizen describes their life situation in plain language, answers a series of targeted follow-up questions, and receives a prioritised bundle of entitlements they're likely eligible for — with estimated values, gateway/cascade dependencies visualised, and an action plan.

### V0.1 situation scope

V0.1 supports **four life situations**:

1. **Ageing parent** ("Mum can't cope on her own anymore")
2. **New baby** ("We're expecting a baby")
3. **Child struggling at school** ("My child is struggling at school")
4. **Lost job** ("I've lost my job")

Other situations (separation, bereavement, retirement, health condition, moving house, consumer disputes) are documented in the design docs but **not included in V0.1**. The engine must handle out-of-scope situations gracefully — acknowledge the situation, provide general signposting to Citizens Advice and GOV.UK, and explain that more situations are coming.

### Design constraints

- **Public APIs and open data only.** No government integrations, no private data sources, no scraping behind authentication. Everything the engine uses must be publicly accessible.
- **Standalone product.** This is not a pitch to government or a partnership play. We build it, we ship it, citizens use it.
- **Gateway cascade is the core value.** The "claim X first because it unlocks Y and Z" sequencing is the primary differentiator from every existing tool. This must be front and centre in the UI.
- **Complementary to existing tools.** We are not competing with Caddy (adviser-facing), entitledto (form-based calculator), or Turn2us (grants search). We are the conversational, situation-first, cascade-aware layer that doesn't exist yet.

### Technology choices

**Frontend:** React (single-page application)
- Conversational UI with chat-like flow
- Interactive results display with collapsible entitlement cards
- Dependency graph visualisation (simple tree/cascade view)
- Responsive — must work on mobile (many users in this demographic are mobile-primary)

**AI layer:** Claude API (Sonnet for conversation)
- Handles natural language intake (Stage 1)
- Situation classification (Stage 2)
- Question selection and branching (Stage 3)
- Fuzzy eligibility reasoning where rules are non-computable (disability assessments, local schemes, complex interactions)

**Calculation layer:** PolicyEngine UK (open source, OpenFisca framework)
- Deterministic rules engine for means-tested benefit calculations (UC, Pension Credit, Tax Credits)
- Computes precise eligibility and estimated amounts where rules are well-defined
- Replaces LLM guesswork for the computable parts of eligibility
- Source: github.com/PolicyEngine/policyengine-uk
- Note: PolicyEngine encodes UK tax-benefit rules programmatically — we feed it household data from the conversation and get back calculated entitlements. The LLM handles situation classification and the non-computable parts; PolicyEngine handles the maths.

**Data layer:** Static JSON (the entitlement data model) + public APIs
- Entitlement definitions, dependency edges, conflict edges, cascade logic
- Situation taxonomy with trigger phrases and claiming orders
- Benefit rates and thresholds (verified against GOV.UK, updated annually)
- Postcode lookup via postcodes.io (free, no API key)
- Loaded at build time where possible, API calls where needed

**No backend required for V0.1.** The Claude API call happens client-side (or via a thin proxy for API key security). PolicyEngine runs client-side via its npm package or via their public API. No user data is stored.

### What V0.1 does NOT include
- Account creation or login
- Saving/resuming sessions (use browser localStorage for session only)
- Actual application submission to any government service
- Integration with any government API
- Council-specific Council Tax Support rules (V0.1 flags "apply to your council" with a link)
- Precise benefit calculations (V0.1 gives estimated ranges)

---

## System Components

### 1. Conversation Engine

The conversation is managed by a system prompt that gives Claude:
- The full entitlement data model (JSON)
- The conversation flow specification
- The current conversation state (what's been asked, what's been answered)
- Instructions for output format at each stage

**System prompt structure:**

```
You are the Entitlement Engine, a tool that helps UK citizens discover
what they're entitled to based on their life situation.

<entitlement_data>
{full JSON data model}
</entitlement_data>

<conversation_rules>
{conversation flow spec — stages, questions, branching logic}
</conversation_rules>

<current_state>
{dynamically injected: answers so far, identified situation(s), 
 entitlements flagged, stage of conversation}
</current_state>

Your task:
1. In Stage 1, listen to the user's description and classify their situation
2. In Stage 3, ask the minimum questions needed to assess eligibility
3. At Stage 4, output a structured JSON bundle of entitlements
4. At Stage 6, output the full bundle with action plan

Always respond in plain English. Never use benefit jargon without explanation.
When you have enough information to show entitlements, output them in this format:
<entitlement_bundle>
{structured JSON that the frontend renders}
</entitlement_bundle>
```

### 2. State Machine

The conversation progresses through defined stages. The frontend tracks state:

```typescript
interface ConversationState {
  stage: 'intake' | 'classifying' | 'questions' | 'preliminary' | 'refining' | 'complete';
  
  // Identified situation(s)
  situations: SituationId[];
  
  // Answers collected
  answers: {
    household_composition?: HouseholdComposition;
    postcode?: string;
    local_authority?: string;
    income_band?: IncomeBand;
    housing_tenure?: HousingTenure;
    disability_or_caring?: DisabilityCaringInfo;
    // Situation-specific answers
    [key: string]: any;
  };
  
  // Entitlements identified
  bundle?: EntitlementBundle;
  
  // Conversation history for Claude context
  messages: Message[];
}

type IncomeBand = 
  | 'under_7400'    // UC free school meals threshold
  | 'under_12570'   // Below personal allowance
  | 'under_16000'   // Below UC capital limit / working tax credit
  | 'under_25000'   // Low income
  | 'under_50270'   // Basic rate taxpayer
  | 'under_60000'   // Below HICBC threshold
  | 'under_100000'  // Below personal allowance taper
  | 'under_125140'  // Within taper zone
  | 'over_125140';  // Above taper
```

### 3. Entitlement Bundle

The output data structure that the frontend renders:

```typescript
interface EntitlementBundle {
  total_estimated_annual_value: {
    low: number;
    high: number;
  };
  
  gateway_entitlements: EntitlementResult[];  // "START HERE"
  cascaded_entitlements: CascadedGroup[];     // Grouped by their gateway
  independent_entitlements: EntitlementResult[]; // Not dependent on a gateway
  
  conflicts: ConflictResolution[];  // Mutual exclusions with recommendation
  
  action_plan: ActionPlanStep[];    // Time-ordered steps
}

interface EntitlementResult {
  id: string;
  name: string;
  plain_description: string;        // No jargon, 1-2 sentences
  estimated_annual_value: {
    low: number;
    high: number;
  };
  confidence: 'likely' | 'possible' | 'check';  // How sure we are
  difficulty: 'automatic' | 'easy' | 'moderate' | 'complex' | 'adversarial';
  application_method: string;       // "Online at GOV.UK" / "Paper form" / etc.
  application_url?: string;
  what_you_need: string[];          // Evidence/documents list
  timeline: string;                 // "Decision in 6-8 weeks"
  why_this_matters?: string;        // For gateway benefits: what it unlocks
}

interface CascadedGroup {
  gateway_id: string;
  gateway_name: string;
  entitlements: EntitlementResult[];
}

interface ConflictResolution {
  option_a: string;                 // e.g. "Tax-Free Childcare"
  option_b: string;                 // e.g. "UC Childcare Element"
  recommendation: string;           // Which is better for this user
  reasoning: string;                // Why
  value_difference: number;         // How much better
}

interface ActionPlanStep {
  week: number | string;            // "1", "2", "after_aa_awarded"
  actions: {
    entitlement_id: string;
    action: string;                 // "Apply online at..."
    priority: 'critical' | 'important' | 'when_ready';
    deadline?: string;              // If time-limited
  }[];
}
```

### 4. Frontend Components

```
<App>
  ├── <ConversationView>
  │   ├── <MessageBubble>           // Chat messages (user + system)
  │   ├── <QuickReplyButtons>       // Suggested responses for common answers
  │   └── <TextInput>               // Free text input
  │
  ├── <BundleView>                  // Shown after Stage 4
  │   ├── <TotalValueBanner>        // "Up to £20,930/year"
  │   ├── <GatewayCard>             // "START HERE" highlighted card
  │   │   └── <CascadeList>         // What this gateway unlocks
  │   ├── <EntitlementCard>         // Individual entitlement details
  │   │   ├── <ValueBadge>
  │   │   ├── <DifficultyBadge>
  │   │   ├── <WhatYouNeed>         // Expandable checklist
  │   │   └── <ApplyLink>
  │   └── <ConflictCard>            // "You need to choose between..."
  │       ├── <OptionComparison>
  │       └── <Recommendation>
  │
  ├── <ActionPlanView>              // Timeline of what to do when
  │   └── <ActionPlanWeek>
  │       └── <ActionItem>
  │
  └── <DependencyGraph>             // Visual cascade map (optional V0.1)
      └── <TreeNode>                // Simple indented tree showing unlocks
```

### 5. Quick Reply System

For common answers, show tappable buttons instead of requiring typed responses:

```typescript
const QUICK_REPLIES: Record<string, QuickReply[]> = {
  household: [
    { label: "Just me", value: { type: "single" } },
    { label: "Me and a partner", value: { type: "couple" } },
    { label: "Me, partner, and children", value: { type: "family" } },
    { label: "Me and children (no partner)", value: { type: "lone_parent" } },
    { label: "Something else", value: { type: "other" } }
  ],
  housing: [
    { label: "Renting (private landlord)", value: "rent_private" },
    { label: "Renting (council/housing association)", value: "rent_social" },
    { label: "Own with a mortgage", value: "mortgage" },
    { label: "Own outright", value: "own_outright" },
    { label: "Living with family", value: "living_with_family" }
  ],
  income_band: [
    { label: "Under £12,500", value: "under_12570" },
    { label: "£12,500 – £25,000", value: "under_25000" },
    { label: "£25,000 – £50,000", value: "under_50270" },
    { label: "£50,000 – £100,000", value: "under_100000" },
    { label: "Over £100,000", value: "over_100000" },
    { label: "I'd rather not say", value: "prefer_not_to_say" }
  ],
  yes_no: [
    { label: "Yes", value: true },
    { label: "No", value: false }
  ]
};
```

---

## Claude API Integration

### Request structure

Each turn sends the full conversation context plus the structured state:

```typescript
async function getNextResponse(state: ConversationState): Promise<ClaudeResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: buildSystemPrompt(state),
      messages: state.messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  });
  
  return parseResponse(await response.json());
}
```

### Response parsing

Claude's response will contain both conversational text AND structured data (when ready to show entitlements). Parse both:

```typescript
interface ClaudeResponse {
  conversational_text: string;        // What to show in the chat
  quick_replies?: QuickReply[];       // Suggested reply buttons
  stage_transition?: string;          // If moving to next stage
  situation_classification?: string[];// Identified situations
  entitlement_bundle?: EntitlementBundle; // When ready to display
}

function parseResponse(raw: any): ClaudeResponse {
  const text = raw.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');
  
  // Extract structured data from XML-like tags in response
  const bundleMatch = text.match(/<entitlement_bundle>([\s\S]*?)<\/entitlement_bundle>/);
  const quickReplyMatch = text.match(/<quick_replies>([\s\S]*?)<\/quick_replies>/);
  
  return {
    conversational_text: text
      .replace(/<entitlement_bundle>[\s\S]*?<\/entitlement_bundle>/, '')
      .replace(/<quick_replies>[\s\S]*?<\/quick_replies>/, '')
      .trim(),
    entitlement_bundle: bundleMatch ? JSON.parse(bundleMatch[1]) : undefined,
    quick_replies: quickReplyMatch ? JSON.parse(quickReplyMatch[1]) : undefined
  };
}
```

### System prompt construction

The system prompt is built dynamically based on conversation state:

```typescript
function buildSystemPrompt(state: ConversationState): string {
  return `
You are the Entitlement Engine. You help UK citizens discover what they're 
entitled to based on their life situation.

CURRENT STAGE: ${state.stage}
IDENTIFIED SITUATIONS: ${state.situations.join(', ') || 'none yet'}
ANSWERS COLLECTED: ${JSON.stringify(state.answers, null, 2)}

${ENTITLEMENT_DATA_JSON}

${CONVERSATION_FLOW_RULES}

INSTRUCTIONS FOR THIS TURN:
${getStageInstructions(state)}

OUTPUT FORMAT:
- Always include conversational text for the user
- When you have enough info to show entitlements, include an <entitlement_bundle> 
  block with structured JSON matching the EntitlementBundle schema
- When asking a question with predefined answers, include a <quick_replies> 
  block listing the options
- When identifying a situation, include <situation> tags
  `;
}
```

---

## Data Files

The build needs these data files:

### 1. `entitlements.json`
The full entitlement data model (already created — entitlement-engine-data-model.json)

### 2. `councils.json` (V0.2+)
Mapping of postcodes to local authorities. For V0.1, use a simple API:

```typescript
// Use postcodes.io (free, no API key)
async function getLocalAuthority(postcode: string): Promise<string> {
  const res = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
  const data = await res.json();
  return data.result.admin_district; // e.g. "Hastings"
}
```

### 3. `benefit_rates.json`
Current benefit rates (updated annually, usually April):

```json
{
  "tax_year": "2024-25",
  "last_updated": "2024-04-08",
  "rates": {
    "attendance_allowance": {
      "lower_weekly": 72.65,
      "higher_weekly": 108.55
    },
    "pension_credit": {
      "single_weekly": 218.15,
      "couple_weekly": 332.95
    },
    "carers_allowance": {
      "weekly": 81.90,
      "earnings_limit_weekly": 151.00
    },
    "child_benefit": {
      "first_child_weekly": 26.05,
      "additional_child_weekly": 17.25,
      "hicbc_threshold": 60000,
      "hicbc_full_clawback": 80000
    },
    "universal_credit": {
      "standard_allowance_single_under_25_monthly": 311.68,
      "standard_allowance_single_25_plus_monthly": 393.45,
      "standard_allowance_couple_under_25_monthly": 489.23,
      "standard_allowance_couple_25_plus_monthly": 617.56,
      "child_element_first_monthly": 333.33,
      "child_element_subsequent_monthly": 287.92,
      "carer_element_monthly": 198.31,
      "lcwra_element_monthly": 416.19,
      "childcare_one_child_max_monthly": 1014.63,
      "childcare_two_children_max_monthly": 1739.37,
      "capital_lower_threshold": 6000,
      "capital_upper_threshold": 16000,
      "free_school_meals_income_threshold": 7400
    },
    "pip": {
      "daily_living_standard_weekly": 72.65,
      "daily_living_enhanced_weekly": 108.55,
      "mobility_standard_weekly": 28.70,
      "mobility_enhanced_weekly": 75.75
    },
    "marriage_allowance": {
      "transferable_amount": 1260,
      "annual_value": 252,
      "backdate_years": 4,
      "max_backdate_value": 1259
    },
    "warm_home_discount": 150,
    "state_pension_full_new_weekly": 221.20,
    "personal_allowance": 12570,
    "basic_rate_limit": 50270,
    "higher_rate_limit": 125140
  }
}
```

---

## Build Order

### Phase 1: Static prototype (no AI)
1. Build the React component structure
2. Hard-code one example situation (ageing parent) with pre-filled answers
3. Build the BundleView with real data from entitlements.json
4. Build the ActionPlanView
5. Style it — clean, accessible, mobile-first

### Phase 2: Conversational flow (with AI)
1. Wire up Claude API
2. Build the system prompt with entitlement data
3. Implement the conversation state machine
4. Build quick reply buttons
5. Test with all situation branches

### Phase 3: Polish
1. Sensitivity handling (pace, tone for bereavement/DV)
2. Compound situation merging
3. "Already claiming" handling
4. Print/export bundle as PDF
5. Accessibility audit (WCAG 2.1 AA minimum)

---

## Hosting & Privacy

### V0.1 hosting
Static site on Vercel/Netlify/GitHub Pages. No server needed (Claude API called client-side via proxy or directly).

### Privacy
- **No data stored.** V0.1 stores nothing server-side.
- **Session only.** Conversation state in React state (lost on page close).
- **No tracking.** No analytics, no cookies, no fingerprinting.
- **Transparency.** Clear statement: "We don't store your information. This conversation exists only in your browser."
- **Claude API.** Note that conversation content is sent to Anthropic's API. Link to Anthropic's privacy policy. Consider: could we run this with a local model for full privacy? Not in V0.1 but worth noting.

### Accuracy and disclaimers

See [accuracy-and-liability.md](accuracy-and-liability.md) for the full framework. Key implementation points:
- Pre-results disclaimer shown once before first results display
- Every entitlement card shows a confidence badge (`likely`, `possible`, `worth_checking`)
- Results footer with signposting to professional advice services
- Stale data warning if benefit rates are from a previous tax year
- Out-of-scope situation message for situations not covered in V0.1

### Accessibility requirements
- Keyboard navigable throughout
- Screen reader compatible (ARIA labels on all interactive elements)
- Minimum contrast ratios (WCAG AA)
- Text resizing up to 200%
- No information conveyed by colour alone
- Quick replies must be keyboard-accessible
- Conversational UI must work with screen readers (live regions for new messages)

---

## Testing Scenarios

### Core test cases

| Scenario | Input | Expected output |
|---|---|---|
| Pensioner on basic state pension | "I'm 78 and my pension barely covers my bills" | AA, PC, CT Reduction, WHD, TV licence, social tariffs. PC as gateway. |
| New parent, moderate income | "We're having our first baby and trying to work out childcare" | CB, TFC vs UC comparison, 15/30 hrs, SMP/MA, Healthy Start. £100k check. |
| Parent of child with SEND | "My son has autism and school isn't supporting him" | EHCP request, DLA child, CA if caring 35hrs, FSM, Carer's Credit. |
| Recently redundant | "I was made redundant last week" | UC immediately (5-week clock), CT Support, FSM if kids, social tariffs. Time-critical flagging. |
| *(V0.2+)* Bereaved spouse under SPA | "My husband died last month" | BSP, CT single person discount, Tell Us Once check, benefit reassessment. Sensitivity handling. |
| *(V0.2+)* Flight delayed | "My Ryanair flight was 4 hours late" | UK261, £220-£520 depending on distance. Escalation path. |
| Compound: baby + redundancy | "I'm 7 months pregnant and just lost my job" | MA (not SMP), UC, Sure Start, Healthy Start, CT Support. Urgent + baby tracks merged. |
| Already claiming PIP | "I get PIP but I feel like I'm missing stuff" | Check: Blue Badge? CT disability reduction? CA for carer? Access to Work? Social tariffs? |
| High earner with kids | "I earn £105k, my wife doesn't work, we have 2 kids" | Marriage Allowance NO (she's non-taxpayer but he's higher rate — wait, check). CB claim for NI credits. Pension salary sacrifice to retain personal allowance. TFC ineligible (>£100k). |
| Crisis: no money for food | "I have no money and my kids haven't eaten properly in days" | EMERGENCY: local welfare assistance, food bank, UC advance. Don't run normal flow. |
| *(V0.1)* Out-of-scope situation | "My flight was delayed 5 hours" | Graceful fallback: acknowledge situation, signpost to Citizens Advice and GOV.UK, explain more situations coming. |

### Edge case tests

- User provides no useful info in Stage 1 → graceful re-prompt
- User says "I don't want to answer that" to income question → proceed with reduced confidence
- User describes situation not in taxonomy → general benefit check
- User is not in UK → politely decline, explain UK-only
- User is under 18 → age-appropriate handling, suggest parent/guardian
