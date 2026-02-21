# Conversation Flow Specification

## The Situation Screener — V0.1 Intake Process

---

## Design Principles for the Conversation

1. **Start open, narrow gradually.** The first question is always open-ended. Let the person describe their situation in their own words. Never start with a form.

2. **Minimum viable questions.** Every question must unlock eligibility assessment for at least 2+ entitlements. If a question only helps with one thing, defer it.

3. **No jargon.** Never say "Universal Credit", "Attendance Allowance", or "Personal Independence Payment" during intake. Use plain English: "help with living costs", "support for daily care needs", "disability payments."

4. **Branch, don't interrogate.** Use the situation description to skip irrelevant questions. If someone says "I've just retired and my pension isn't enough", don't ask about childcare.

5. **Show value early.** After 3-4 questions, give a preliminary indication: "Based on what you've told me so far, there are already at least 4 things you might be entitled to. Let me ask a few more questions to be sure."

6. **Sensitive handling.** Some situations involve bereavement, abuse, disability, or financial crisis. The tone must be warm and unhurried. Never rush through sensitive disclosures.

---

## Flow Architecture

```
STAGE 1: Open Situation Intake
    ↓
STAGE 2: Situation Classification (internal — not shown to user)
    ↓
STAGE 3: Targeted Follow-up Questions (branched by situation)
    ↓
STAGE 4: Preliminary Bundle Display ("Here's what we've found so far")
    ↓
STAGE 5: Refinement Questions (optional — to confirm edge cases)
    ↓
STAGE 6: Full Bundle Display with Priorities and Cascade Map
```

---

## STAGE 1: Open Situation Intake

### Opening prompt

> "Tell me what's going on — in your own words. It could be something that's just happened, something you're planning, or something you've been dealing with for a while. There are no wrong answers here."

### What we're listening for

The LLM classifies the response against the situation taxonomy. Key signals:

| Signal in user's words | Maps to situation | Confidence |
|---|---|---|
| "mum/dad/parent" + "struggling/falling/can't cope" | ageing_parent | HIGH |
| "pregnant/expecting/baby/due" | new_baby | HIGH |
| "child" + "school/learning/behaviour/excluded" | child_struggling_school | HIGH |
| "redundant/sacked/lost my job/no work" | lost_job | HIGH |
| "leaving/separating/divorce" | separation | HIGH |
| "died/passed away/lost my partner" | bereavement | HIGH |
| "retired/pension/getting old" | retirement_low_income | MEDIUM |
| "ill/disabled/can't work/health" | health_condition | MEDIUM |
| "flight/train/refund/ripped off" | consumer_dispute | HIGH |
| Multiple signals | compound_situation | Flag for multi-track |

### If unclear

> "Thanks for sharing that. To make sure I point you to the right things, could you tell me a bit more about what's changed recently, or what's worrying you most right now?"

### Compound situations

If the user describes multiple situations (e.g. "I've just had a baby and my partner's left"), classify as compound and run both situation tracks, merging the entitlement bundles and de-duplicating.

---

## STAGE 2: Situation Classification (Internal)

The system identifies:
- **Primary situation** (the main thing that's happening)
- **Secondary situations** (related or overlapping)
- **Sensitivity flags** (bereavement, domestic abuse, disability, mental health crisis)
- **Time criticality** (lost job = urgent; retirement planning = less urgent)

This drives which question branch to follow in Stage 3.

---

## STAGE 3: Targeted Follow-up Questions

### Universal questions (asked in every situation)

These 5 questions unlock assessment across the widest range of entitlements:

**Q1: Household composition**
> "Who lives in your household? Just roughly — is it just you, you and a partner, or are there children or other family members?"

*Branching:*
- If children → ask ages
- If partner → ask if married/civil partnership (for Marriage Allowance)
- If alone → flag Council Tax single person discount

**Q2: Location**
> "What's your postcode? This helps me check what's available in your local area — councils run different schemes."

*Unlocks: Local council identification, Council Tax Support scheme, local welfare assistance, local housing authority*

**Q3: Rough income**
> "Roughly, what's the household income? It doesn't need to be exact — a ballpark helps me check which support you might qualify for."

*If reluctant:* "I completely understand. Even knowing whether it's above or below about £25,000 a year would help me narrow things down."

*Branching:*
- Under ~£16,000 and of working age → UC likely eligible, flag all passported benefits
- Under pension credit threshold and over SPA → Pension Credit likely, flag full cascade
- Near £100k → flag cliff edges (personal allowance taper, childcare loss)
- Over £60k with children → flag HICBC interaction

**Q4: Housing situation**
> "Do you own your home, rent, or are you in another situation?"

*Branching:*
- Renting → UC housing element, housing benefit, DHP
- Mortgage → Support for Mortgage Interest (if on qualifying benefits, after 9 months)
- Own outright → Council Tax main concern

**Q5: Disability or caring**
> "Does anyone in the household have a disability, long-term health condition, or need regular help with daily tasks?"

*Branching:*
- Person themselves → PIP/AA assessment path
- Child → DLA, EHCP path
- They care for someone outside household → Carer's Allowance path
- Someone in household needs care → both disability benefit + carer benefit path

---

### Situation-specific questions

> **V0.1 scope:** Only the four branches below (Ageing Parent, New Baby, Child Struggling at School, Lost Job) are implemented. Bereavement, Separation, and Consumer Dispute branches are documented for V0.2+.

#### Branch: Ageing Parent

**Q6:** "How old is your mum/dad?"
*Determines: AA vs PIP, state pension age, Pension Credit eligibility*

**Q7:** "What kind of help do they need day-to-day? Things like washing, dressing, cooking, getting around, remembering medication — anything that's become difficult."
*Determines: AA lower/higher rate, social care assessment need*

**Q8:** "Are they getting any benefits or pension top-ups at the moment that you know of?"
*Determines: What's already claimed, what's missing. Often the answer is "just the state pension" which means everything else is unclaimed.*

**Q9:** "Is anyone helping look after them regularly? If so, roughly how many hours a week?"
*Determines: Carer's Allowance eligibility, Carer's Credit*

**Q10:** "Do they own or rent their home?"
*Determines: Housing Benefit, Council Tax situation, Disabled Facilities Grant potential*

#### Branch: New Baby

**Q6:** "Are you currently employed? And your partner, if you have one?"
*Determines: SMP vs Maternity Allowance, Shared Parental Leave, NMW threshold for childcare schemes*

**Q7:** "Is this your first child?"
*Determines: Sure Start Maternity Grant, Child Benefit rate*

**Q8:** "Are you thinking about childcare when you go back to work?"
*Determines: TFC vs UC childcare element calculation, 15/30 hours eligibility*

**Q9:** "Does either of you earn close to or above £100,000?"
*Determines: £100k cliff edge, HICBC, personal allowance taper, optimal pension contribution*

#### Branch: Child Struggling at School

**Q6:** "How old is your child?"
*Determines: DLA vs PIP, school phase, EHCP applicability*

**Q7:** "Has the school mentioned any kind of additional support, or have they been assessed for anything?"
*Determines: Whether SEN Support is in place, whether EHCP has been considered, what the school is already providing*

**Q8:** "Does your child need extra help at home too — things like getting dressed, managing behaviour, sleeping, or staying safe?"
*Determines: DLA care component eligibility*

**Q9:** "How is this affecting you as a family? Are you or your partner having to reduce work hours or stop working to help?"
*Determines: Carer's Allowance, UC carer element, Carer's Credit*

#### Branch: Lost Job

**Q6:** "When did you leave your job? And how long were you there?"
*Determines: Redundancy pay entitlement, New Style JSA eligibility, urgency of UC claim*

**Q7:** "Were you made redundant, or was it something else?"
*Determines: Statutory redundancy pay, unfair dismissal rights*

**Q8:** "Have you applied for Universal Credit yet?"
*Determines: Whether the 5-week clock has started*

**Q9:** "Do you have any savings?"
*Determines: UC capital rules (£6k-£16k reduces award, >£16k = no UC), whether advance is needed*

#### Branch: Bereavement *(V0.2+)*

**Sensitivity note:** Slower pace. More empathetic framing. Don't rush.

**Q6:** "I'm sorry for your loss. Can I ask — was the person who died your husband, wife, or civil partner?"
*Determines: Bereavement Support Payment, state pension inheritance, Tell Us Once*

**Q7:** "Are you under or over state pension age?"
*Determines: BSP eligibility (under SPA only)*

**Q8:** "Do you have children who are still dependent?"
*Determines: BSP higher rate, child-related benefits, UC*

**Q9:** "Has the death been registered yet? The registrar should have offered you a service called Tell Us Once — did that happen?"
*Determines: Whether Tell Us Once has been used, what notifications have already been done*

#### Branch: Separation *(V0.2+)*

**Sensitivity note:** Check for domestic abuse signals. If present, prioritise safety and Legal Aid.

**Q6:** "Are you safe? Is there anything happening that makes you feel unsafe?"
*If yes → prioritise: National Domestic Abuse Helpline (0808 2000 247), Legal Aid for DV, housing*

**Q7:** "Do you have children together?"
*Determines: Child Maintenance Service, child benefit allocation, school meals*

**Q8:** "What's your housing situation — are you staying in the current home, looking for somewhere new, or not sure yet?"
*Determines: Council Tax change, UC housing element, DHP for deposit, housing allocation*

#### Branch: Consumer Dispute *(V0.2+)*

**Q6:** "What happened? Was it a flight, a train journey, something you bought, or a service?"
*Determines: Which regulatory/compensation framework applies*

**Q7 (flights):** "Where were you flying from and to, and how long was the delay?"
*Determines: UK261 applicability, compensation band*

**Q7 (trains):** "Which train company were you travelling with, and how long was the delay?"
*Determines: Delay Repay thresholds, operator-specific scheme*

**Q7 (purchase):** "How much did you pay, and did you use a credit card?"
*Determines: Section 75 (credit card £100-£30k), chargeback, small claims*

---

## STAGE 4: Preliminary Bundle Display

After the situation-specific questions (typically 8-10 questions total from the opening), display:

### Display format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Based on what you've told me, here's what
  you might be entitled to:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⭐ START HERE (this unlocks the others)
  ┌─────────────────────────────────────────┐
  │ Attendance Allowance                    │
  │ Up to £5,600/year • No means test       │
  │ Difficulty: 🟡 Moderate (paper form)    │
  │                                         │
  │ This is worth doing first because it    │
  │ helps qualify you for several other      │
  │ things on this list.                     │
  └─────────────────────────────────────────┘

  UNLOCKED BY THE ABOVE
  ┌─────────────────────────────────────────┐
  │ ✓ Pension Credit                        │
  │   Up to £8,000/year                     │
  │                                         │
  │ ✓ Council Tax Reduction                 │
  │   Up to £2,500/year (possibly 100%)     │
  │                                         │
  │ ✓ Warm Home Discount                    │
  │   £150/year (automatic)                 │
  │                                         │
  │ ✓ Free TV Licence (75+)                 │
  │   £169.50/year                          │
  └─────────────────────────────────────────┘

  ALSO WORTH CLAIMING
  ┌─────────────────────────────────────────┐
  │ ○ Carer's Allowance (for you)           │
  │   £4,260/year                           │
  │                                         │
  │ ○ Carer's Credit                        │
  │   Protects your state pension            │
  │                                         │
  │ ○ Broadband social tariff               │
  │   Save ~£200/year                        │
  └─────────────────────────────────────────┘

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ESTIMATED TOTAL VALUE: up to £20,930/year
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Key display rules

1. **Gateway benefits always at the top** with a clear "START HERE" marker
2. **Cascaded benefits grouped under their gateway** so the dependency is visible
3. **Estimated values shown** — even rough ranges are motivating
4. **Difficulty rating** for each: 🟢 Easy / 🟡 Moderate / 🔴 Complex / ⚫ Adversarial
5. **Total annual value** at the bottom — the headline number
6. **No jargon in descriptions** — but include the official name for people who want to search

---

## STAGE 5: Refinement Questions (Optional)

After showing the preliminary bundle, offer to refine:

> "This is based on what you've told me so far. A few more details would help me be more precise — but if you'd rather just get started with what's here, that's fine too."

Optional refinement questions:
- Exact income figure (for precise UC/PC calculation)
- Savings/capital amount (for capital rules)
- Specific disability details (for PIP/AA rate prediction)
- Partner's income (for couple assessment)
- Current benefits already received (to avoid duplicates)

---

## STAGE 6: Full Bundle with Action Plan

After refinement, display the final bundle with:

### For each entitlement:

```
┌────────────────────────────────────────────────┐
│ ATTENDANCE ALLOWANCE                           │
│                                                │
│ What it is: A weekly payment if you need       │
│ help with daily tasks like washing, dressing,  │
│ or getting around. NOT means-tested — your     │
│ income and savings don't matter.               │
│                                                │
│ Estimated value: £72.65 – £108.55/week         │
│                  (£3,778 – £5,645/year)        │
│                                                │
│ How to claim: Paper form. You'll describe      │
│ what help you need day-to-day. The form asks   │
│ about specific activities.                     │
│                                                │
│ What you'll need:                              │
│ • GP or consultant details                     │
│ • Description of daily care needs              │
│ • Any relevant medical letters                 │
│                                                │
│ Timeline: Decision usually within 8 weeks      │
│                                                │
│ Why this is first: Claiming this strengthens   │
│ your Pension Credit application and means      │
│ a family member can claim Carer's Allowance.   │
│                                                │
│ [Start this claim →]                           │
└────────────────────────────────────────────────┘
```

### Action plan timeline:

```
WEEK 1
  □ Apply for Attendance Allowance (paper form — we'll help you fill it in)
  □ Apply for Pension Credit (online or phone — we'll guide you through)
  □ Apply for Council Tax Reduction (your local council)

WEEK 2
  □ Contact energy supplier about Warm Home Discount
  □ Apply for broadband social tariff

ONCE AA IS AWARDED (typically 6-8 weeks)
  □ Apply for Carer's Allowance
  □ Claim Carer's Credit
  □ Check Blue Badge eligibility

ONGOING
  □ Annual Pension Credit review
  □ Council Tax reviewed annually
  □ AA can be reviewed if needs change
```

---

## Edge Cases and Special Handling

### Out-of-scope situations (V0.1)

If the engine identifies a situation not covered in V0.1 (bereavement, separation, retirement, health condition, moving house, consumer dispute), it should:

1. **Acknowledge** the situation empathetically: "It sounds like you're dealing with [situation description]."
2. **Explain** that this area isn't fully covered yet: "We're still building our coverage of this area, so I can't give you a detailed assessment right now."
3. **Signpost** to professional services:
   - Citizens Advice: citizensadvice.org.uk or 0800 144 8848
   - GOV.UK benefits: gov.uk/browse/benefits
   - For sensitive situations (bereavement, domestic abuse): specific helpline numbers
4. **Offer** to check the universal questions anyway: "I can still check a few general things for you — like whether you're getting everything you're entitled to on council tax, or any support with utility bills. Would that be helpful?"

If the situation is **compound** (one in-scope + one out-of-scope, e.g. "I've lost my job and my partner left"), run the in-scope branch fully and handle the out-of-scope part with signposting.

### Disclaimer integration

The conversation must include disclaimers at key points (see [accuracy-and-liability.md](accuracy-and-liability.md)):

- **Before showing results (Stage 4):** Display the pre-results disclaimer
- **With each entitlement:** Show the confidence badge and per-result disclaimer
- **After results (Stage 6):** Show the footer with signposting to professional advice
- **Never** use language that implies guaranteed eligibility

### Compound situations
User describes multiple situations. Engine runs all relevant branches, merges bundles, de-duplicates, and re-sorts by priority. The gateway logic still applies — if two situations both need UC, UC appears once but with both sets of elements flagged.

### Already claiming some things
User says "I already get PIP." Engine removes PIP from the bundle, but checks whether the user is claiming everything PIP unlocks (Blue Badge? Carer's Allowance for their carer? Council Tax disability reduction?). Often the answer is no.

### Ineligible for expected benefit
If assessment shows user is likely ineligible for something they expected, explain clearly and suggest alternatives. "Based on your income, you probably won't qualify for Pension Credit — but it's still worth checking Council Tax Reduction separately with your council, as the rules are different."

### User is in crisis
If signals suggest immediate hardship (no food, threat of eviction, utilities disconnected):
- Prioritise emergency support: local welfare assistance fund, food banks, utility hardship funds
- UC advance payment (available immediately, repaid over 24 months)
- Discretionary Housing Payment
- Citizens Advice referral
- Don't run the full situation flow — address the crisis first

### User is a professional (adviser, carer, social worker)
If user says "I'm helping someone" or "I'm an adviser" — adjust tone. Less emotional support, more technical precision. Offer to generate a printable checklist they can work through with their client.

---

## Conversation Tone Guidelines

### Do
- Use "you" and "your" — speak directly
- Acknowledge emotions: "That sounds really difficult"
- Celebrate findings: "Good news — you're almost certainly entitled to this"
- Be honest about complexity: "This one's a longer process, but it's worth it"
- Use concrete numbers: "up to £5,645 a year"

### Don't
- Use benefit jargon without explanation
- Say "you should" (implies blame for not already doing it)
- Rush sensitive disclosures
- Promise amounts (always "up to" or "estimated")
- Assume digital literacy ("go to GOV.UK and..." — not everyone can)
- Say "just" — "just fill in the form" minimises difficulty

### Sensitivity markers
When a situation is flagged as sensitive (bereavement, separation, domestic abuse, disability disclosure):
- Slower conversational pace
- More acknowledgment phrases
- Fewer questions per turn
- Explicit offers to pause or come back later
- Clear signposting to human support (Samaritans, National DA Helpline, Citizens Advice)
