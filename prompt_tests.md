# Prompt Tests — Manual Testing on Live Site

Test scenarios for Check My Benefits, ordered simple → complex within each section. Copy-paste each prompt into the conversation. Check that the results bundle includes the listed entitlements.

---

## 1. First Contact & Situation Detection

### 1.1 Minimal / vague messages

**1.1a** "I need help"
- Should ask a follow-up question, not produce results
- No situation should be detected yet

**1.1b** "Benefits"
- Should ask what's going on in their life
- No assumptions made

**1.1c** "Hi"
- Should greet and ask about their situation

### 1.2 Single clear situation

**1.2a** "My mum can't cope on her own anymore"
- Should detect: ageing parent / caring situation
- Should ask about mum's age, what help she needs

**1.2b** "I've just lost my job"
- Should detect: job loss
- Should ask about housing, savings, dependants

**1.2c** "We're expecting our first baby in March"
- Should detect: new baby
- Should ask about employment, income, housing

**1.2d** "My 7 year old has just been diagnosed with ADHD and the school can't handle him"
- Should detect: child struggling / SEN
- Should ask about support needs, other children

### 1.3 Multi-situation

**1.3a** "I'm caring for my dad who's 85 and needs help with everything. My partner just lost his job last week."
- Should detect both caring AND job loss
- Should ask about both situations

**1.3b** "I've got three kids, the youngest has autism. I was just made redundant and my mum who's 79 needs more and more help."
- Should detect: child SEN, job loss, ageing parent
- Expect a rich bundle covering all three

---

## 2. Income & Financial Details

### 2.1 Clear income statements

**2.1a** "I earn about £12,000 a year"
- Should map to income band under_12570

**2.1b** "My wife earns £25,000"
- Should map to under_25000 for partner

**2.1c** "We're on about £45k between us"
- Should map to under_50270

### 2.2 Indirect income

**2.2a** "I'm on minimum wage, 20 hours a week"
- Should calculate ~£12,000 and map appropriately

**2.2b** "Just JSA at the moment, nothing else"
- Should map to very low income (under_7400)

**2.2c** "I get my state pension and that's it"
- Should map to ~£12,000 (under_12570)

### 2.3 Income thresholds that change eligibility

**2.3a** Start with: "I'm 30, single, renting privately for £800/month, no kids"
Then: "I earn £6,500 a year"
- Should show UC as likely (under £7,400 threshold)
- Free school meals irrelevant (no kids)

**2.3b** Same setup, then: "I earn £15,000 a year"
- UC still possible but confidence lower
- Fewer passported benefits

**2.3c** Same setup, then: "I earn £55,000 a year"
- UC unlikely
- Marriage allowance possible if partnered
- Very few means-tested benefits

---

## 3. Implicit Inference

Test that the system picks up on context clues without explicit statements.

**3a** "My wife and I have been struggling since I lost my job"
- Should infer: couple_married, unemployed

**3b** "I don't know how we'll pay the mortgage"
- Should infer: housing_tenure = mortgage

**3c** "I was made redundant two weeks ago"
- Should infer: unemployed, recently_redundant

**3d** "I rent from the council"
- Should infer: housing_tenure = rent_social

**3e** "I'm living with my parents at the moment"
- Should infer: housing_tenure = living_with_family

**3f** "My civil partner and I..."
- Should infer: couple_civil_partner

---

## 4. Pension-Age Scenarios (60+)

### 4.1 Simple pensioner

**4.1a** "I'm 68, living on my state pension. That's all I've got."
- **Expect:** Pension Credit (gateway), Attendance Allowance mention, Council Tax Reduction, free NHS prescriptions, free sight tests, Winter Fuel Payment, Warm Home Discount, concessionary bus travel
- Cascade: PC → free prescriptions, dental, sight tests, optical vouchers, travel costs

**4.1b** "I'm 72 and I already get Pension Credit."
- **Expect:** All passported benefits from PC: free prescriptions, free dental, free sight tests, optical vouchers, NHS travel costs, Council Tax Reduction, Warm Home Discount, Cold Weather Payment, free TV licence (if 75+), social tariff broadband
- Should show PC as the gateway with cascade tree

### 4.2 Pensioner with care needs

**4.2a** "I'm 78 and I need help getting dressed and making meals. I live alone."
- **Expect:** Attendance Allowance (gateway), Pension Credit (if income low enough), Council Tax single person discount, all NHS cascades, concessionary bus

**4.2b** "My dad is 85, he has dementia and needs help with everything. He lives alone on his state pension."
- **Expect for dad:** AA (gateway) → PC top-up → CT Reduction → all NHS → Warm Home Discount
- **Expect for user:** Carer's Allowance (if 35+ hrs), Carer's Credit

### 4.3 Couple, pension age

**4.3a** "We're both 70. My wife gets a small workplace pension of £50 a week on top of state pension. I just get state pension."
- **Expect:** PC couple rate check (£346.60/week threshold), CT Reduction, Winter Fuel Payment x2, concessionary bus x2

### 4.4 Just above PC threshold

**4.4a** "I'm 70, my total income is about £14,000 a year. I pay for everything — prescriptions, dental, glasses."
- **Expect:** NHS Low Income Scheme (HC2/HC3) as gateway → free/reduced prescriptions, dental, sight tests, optical vouchers
- PC may show as worth_checking
- Prescription Prepayment Certificate as fallback

---

## 5. Working-Age Job Loss

### 5.1 Simple redundancy

**5.1a** "I'm 34, single, just been made redundant. I rent a council flat in Birmingham for £600 a month. I've got about £3,000 in savings."
- **Expect:** UC (gateway) → Council Tax Support, free prescriptions, free dental, free sight tests, Warm Home Discount, social tariff broadband
- Action plan: apply for UC immediately (5-week wait)

**5.1b** "Lost my job yesterday. I'm 28, living with my parents, no savings."
- **Expect:** UC (simplified — no housing element), Council Tax Support (if contributing)
- Fewer cascaded benefits (no rent = no housing element)

### 5.2 With dependants

**5.2a** "I've been made redundant. I'm 40, married, two kids aged 8 and 5. My wife works part-time earning £12,000. We rent privately for £1,100."
- **Expect:** UC (with child elements, housing element), Child Benefit (if not already claiming), free school meals, free childcare 15hrs (for 5-year-old), Council Tax Support
- TFC vs UC childcare conflict card

**5.2b** "Just lost my job. Single dad, 3 kids aged 2, 6, and 14. Council house, £500 rent."
- **Expect:** UC (gateway), Child Benefit, free school meals, free 15hrs childcare (disadvantaged, age 2), free 15hrs universal (if age 3-4 — but child is 2 so disadvantaged), Healthy Start (child under 4), social tariff broadband

### 5.3 With mortgage

**5.3a** "I lost my job 10 months ago. I'm on UC. My mortgage is £1,000 a month and I can't keep up."
- **Expect:** Support for Mortgage Interest (9+ months on UC — eligible), UC review
- SMI is a loan, not a grant — should be flagged

**5.3b** "Just been made redundant last week. Mortgage is £1,200 a month."
- **Expect:** UC (gateway), but SMI not yet (need 9 months on UC)
- Should mention SMI as future possibility after 9 months

---

## 6. New Baby & Pregnancy

### 6.1 Simple pregnancy

**6.1a** "I'm pregnant with my first baby. I work part time at Tesco."
- **Expect:** Maternity Allowance or SMP check, Child Benefit (when born), free prescriptions (maternity exemption cert), free dental, Healthy Start (if low income), Sure Start Maternity Grant (if on qualifying benefit)

**6.1b** "We're expecting our first baby. I earn £30,000 and my partner earns £35,000."
- **Expect:** Child Benefit (claim it — NI credits), Maternity Exemption Cert (free prescriptions), Tax-Free Childcare (when returning to work), free 15hrs childcare (from age 3), 30hrs childcare (both working)
- Fewer means-tested benefits at this income

### 6.2 Pregnancy on low income

**6.2a** "I'm pregnant with my first baby. I'm on Universal Credit earning about £8,000 a year part-time."
- **Expect:** Sure Start Maternity Grant (£500), Healthy Start vouchers, maternity exemption cert, free prescriptions, free dental, Child Benefit, UC child element (when born), free 15hrs childcare (disadvantaged, from age 2)

### 6.3 Multiple children

**6.3a** "I've just had my third baby. I'm a single mum, I work 16 hours a week on minimum wage. I rent privately."
- **Expect:** UC (with 3 child elements), Child Benefit (3 children), Healthy Start (baby under 1 = £8.50/week), free school meals (for older children if school-age), free childcare 15hrs disadvantaged (baby from age 2)
- Note: Sure Start Maternity Grant only for FIRST child on UC

---

## 7. Caring & Disability

### 7.1 Caring for a parent

**7.1a** "I look after my mum who's 82. She needs help with everything — washing, cooking, taking her tablets. I spend about 40 hours a week caring for her."
- **Expect for user:** Carer's Allowance (£83.30/week, 35+ hrs), Carer's Credit (NI protection)
- **Expect for mum:** Attendance Allowance (gateway), Pension Credit, Council Tax Reduction, all NHS cascades
- Cascade: mum's AA → PC → unlocks CA for carer

**7.1b** "I help my dad out a few times a week. He's 75 and a bit unsteady on his feet."
- **Expect:** Carer's Credit (possible, 20+ hrs), AA for dad (possible — needs assessment)
- CA unlikely if under 35 hours

### 7.2 User has disability

**7.2a** "I've been diagnosed with MS and I can't work anymore. I'm 38, single, renting privately."
- **Expect:** PIP (gateway), UC with LCWRA element, Council Tax Disability Reduction, Blue Badge (possible), free prescriptions (if on qualifying benefit)
- If PIP enhanced mobility: VED exemption, Motability, concessionary bus

**7.2b** "I'm in a wheelchair and I'm getting PIP enhanced rate mobility."
- **Expect:** Blue Badge (likely — auto-qualify), VED exemption (likely), Motability scheme (likely), concessionary bus travel
- These should cascade from PIP enhanced mobility

**7.2c** "I have severe depression and I'm struggling to leave the house most days. I'm 29, renting, earning about £10,000."
- **Expect:** PIP (possible — mental health qualifies), UC with LCWRA element (possible), Council Tax Disability Reduction (possible), free prescriptions cascade

### 7.3 Caring for partner

**7.3a** "My husband has early-onset dementia. I'm caring for him about 40 hours a week. I had to leave my job. We're both 56."
- **Expect for user:** Carer's Allowance, Carer's Credit, UC (if low income)
- **Expect for husband:** PIP (under SPA), UC LCWRA element
- Cascade: husband's PIP → qualifies Carer's Allowance → UC carer element

### 7.4 Disabled child

**7.4a** "My 4 year old has cerebral palsy and needs constant care. I can't work because of his needs. My partner earns £18,000. We rent from the council."
- **Expect:** DLA (child), Carer's Allowance (for parent), UC (with disabled child element + carer element), free childcare 15hrs (universal at 3-4, plus disadvantaged), EHCP assessment, Blue Badge (possible for child)

**7.4b** "My 7 year old has just been diagnosed with ADHD. The school says they can't provide extra support."
- **Expect:** EHCP assessment (right to request, 90%+ appeal win rate), DLA (possible), free school meals (if low income)
- Should emphasise EHCP rights and appeal success rate

---

## 8. Bereavement

### 8.1 Partner died

**8.1a** "My husband died last month. I have two children aged 5 and 3. I work part-time earning about £15,000."
- **Expect:** Bereavement Support Payment (£3,500 lump sum + £350/month for 18 months), Child Benefit, UC (possible with child elements), Council Tax single person discount, free school meals (if income qualifies)

**8.1b** "I'm a widower, 72 years old. I'm just living on my state pension. My wife passed away six months ago."
- **Expect:** Pension Credit (single rate now), CT single person discount, CT Reduction, all NHS cascades from PC, Winter Fuel Payment, Warm Home Discount, concessionary bus

### 8.2 Parent died

**8.2a** "My mum died last week. I was her full-time carer for the last three years. I'm 45 and I don't have a job now."
- **Expect:** Funeral Expenses Payment (if on qualifying benefit), UC (urgently — no income), Carer's Allowance run-on (8 weeks after death)
- Action plan should note CA stops but there's an 8-week run-on period

**8.2b** "My mum died last week. I'm on Universal Credit and I need to pay for the funeral. I don't have any savings."
- **Expect:** Funeral Expenses Payment (likely — on UC, responsible for funeral), bereavement counselling signposting

---

## 9. Separation & Relationship Breakdown

**9a** "I'm going through a divorce. I have two kids aged 8 and 12. I'll be moving out and need to rent somewhere. I earn about £22,000."
- **Expect:** UC (possible — now single income), Child Benefit (ensure claiming), free school meals (check), Council Tax single person discount (new single household), CT Support

**9b** "I've left an abusive relationship. I have no income and I'm staying with my family for now. I have a 2 year old."
- **Expect:** UC (urgent — no income), Child Benefit, Healthy Start, free childcare 15hrs disadvantaged (age 2 on UC), free prescriptions cascade, social tariff broadband
- Should handle sensitively — 1 question per turn

**9c** "I've separated from my husband. The mortgage is in both our names, £1,100 a month. I'm on minimum wage, about £12,000 a year."
- **Expect:** UC (possible — single income now), Support for Mortgage Interest (after 9 months on UC), Marriage Allowance (check if still applicable during separation), CT single person discount

---

## 10. NHS Health Costs Cascades

### 10.1 Auto-exempt groups

**10.1a** "I'm 62, single, on Pension Credit. I pay for my prescriptions and dental — is there help?"
- **Expect:** Free prescriptions (auto — on PC), free dental (auto — on PC), free sight tests (auto — 60+), optical vouchers, NHS travel costs
- Should show PC as gateway unlocking all of these

**10.1b** "I'm on Universal Credit with two kids. I didn't know I could get free dental and eye tests."
- **Expect:** Free prescriptions, free dental, free sight tests, optical vouchers (all auto on UC)

### 10.2 Medical exemptions

**10.2a** "I'm 35, I have diabetes, earning £18,000 a year. I spend a fortune on prescriptions and dental."
- **Expect:** Free prescriptions (medical exemption — diabetes), NHS Low Income Scheme for dental/sight tests (income too high for auto but LIS possible)

**10.2b** "I have epilepsy and I'm on lots of medication. I earn about £25,000."
- **Expect:** Free prescriptions (medical exemption — epilepsy), Prescription Prepayment Certificate NOT needed (already exempt)

### 10.3 No qualifying benefit but high costs

**10.3a** "I'm 45, I earn £40k, no benefits. I'm on 6 prescriptions a month."
- **Expect:** Prescription Prepayment Certificate (£111.60/year saves money at 12+ prescriptions/year — they have 72/year)
- Should NOT suggest free prescriptions (income too high, no medical exemption)

### 10.4 Near-threshold

**10.4a** "I'm 70, income about £240 a week. I pay for everything — prescriptions cost me a fortune."
- **Expect:** NHS Low Income Scheme (HC2/HC3 certificate), PC worth_checking (£227.10 single threshold — they're just above)
- HC2 would unlock free prescriptions, dental, sight tests, optical vouchers

---

## 11. Childcare & Education

### 11.1 Universal free hours

**11.1a** "I have a 3 year old. Do I get any free childcare?"
- **Expect:** Free 15hrs childcare (universal — ALL 3-4 year olds)
- If working: 30hrs childcare possible

### 11.2 Disadvantaged 2-year-olds

**11.2a** "I have a 2 year old and I'm on Universal Credit."
- **Expect:** Free 15hrs childcare (disadvantaged — age 2 on UC)

### 11.3 Working parents — 30hrs + TFC

**11.3a** "We both work full-time. I earn £35,000, my husband earns £30,000. Our daughter is 1 year old and childcare costs £1,200 a month."
- **Expect:** 30hrs free childcare (from age 9 months if both working), Tax-Free Childcare (£2,000/year government top-up), Child Benefit
- TFC vs UC childcare conflict (but at this income, TFC is better)

### 11.4 Student parents

**11.4a** "I'm a full-time university student with a 3 year old. I'm single and struggling with childcare costs."
- **Expect:** Childcare Grant (students — up to 85% of costs), free 15hrs childcare (universal, age 3), Student Maintenance Loan, Child Benefit

### 11.5 Older children in education

**11.5a** "My 17 year old is doing A-levels at college. We're on a low income, about £15,000 a year."
- **Expect:** 16-19 Bursary (£100-£1,200/year), free school meals (if qualifying benefit), Child Benefit (still eligible up to 20 if in approved education)

---

## 12. Housing, Energy & Water

### 12.1 Pensioner renting

**12.1a** "I'm 70, living alone, renting privately for £650 a month. Just on my state pension."
- **Expect:** Housing Benefit (pension-age renter), Pension Credit, Council Tax Reduction, Council Tax single person discount, Winter Fuel Payment, Warm Home Discount, Cold Weather Payment

### 12.2 Mortgage struggles

**12.2a** "I've been on UC for over a year. My mortgage is £1,000 a month and I'm falling behind."
- **Expect:** Support for Mortgage Interest (9+ months on UC — eligible). Should explain it's a LOAN secured against the property, not a grant.

### 12.3 Water bills

**12.3a** "I'm on Universal Credit with 4 kids aged 1, 3, 5, and 8. We're on a water meter and the bills are massive."
- **Expect:** WaterSure (water meter + qualifying benefit + 3+ children under school age OR medical need), social tariff water

**12.3b** "I'm on UC, water meter, but I only have 1 child."
- **Expect:** WaterSure less likely (need 3+ children OR medical condition), but social tariff water still possible

### 12.4 Cold home / insulation

**12.4a** "I'm 75, on Pension Credit. My house is freezing — no insulation and the heating barely works."
- **Expect:** Warm Home Discount (£150, auto on PC Guarantee), Cold Weather Payment (£25 per cold spell, auto), ECO4 home insulation (free/subsidised), Winter Fuel Payment

---

## 13. Transport & Mobility

**13a** "I'm 67, getting PIP enhanced rate mobility. I'm struggling with transport costs."
- **Expect:** Vehicle Excise Duty exemption (free road tax), Motability scheme (exchange mobility component for car lease), concessionary bus travel (age 60+), Blue Badge (auto-qualify PIP enhanced mobility)

**13b** "I'm 62, no disability, I just find public transport expensive."
- **Expect:** Concessionary bus travel (free off-peak, age 60+)
- Not much else in transport category without disability

---

## 14. Legal & Consumer

**14a** "I'm on UC, earning about £10,000 a year. I need to go to a housing tribunal about my landlord. I can't afford the fees."
- **Expect:** Court Fee Remission (on UC = auto-qualify for full remission)

**14b** "I need to take my landlord to court. I earn £20,000 and have about £2,000 in savings."
- **Expect:** Court Fee Remission (possible — income under threshold + capital under £4,000)

---

## 15. Complex Multi-Factor Scenarios

These test the full cascade engine with multiple interacting entitlements.

### 15.1 The works — ageing parent cascade

**Prompt:** "I'm 50, married. My mum is 82, she lives alone, she can't wash or dress herself, she forgets to eat. I go round every day for about 5 hours. My wife works and earns £28,000. We have a mortgage of £900 a month."

**Expected bundle should include:**
- **For mum:** Attendance Allowance (gateway) → Pension Credit → Council Tax Reduction → free prescriptions, dental, sight tests, optical vouchers → Warm Home Discount → Cold Weather Payment → concessionary bus
- **For user:** Carer's Allowance (35+ hrs/week) → Carer's Credit (NI protection)
- **For household:** Marriage Allowance (possible), Council Tax Disability Reduction (if mum's home adapted)
- Gateway cascade should show AA as "START HERE" for mum

### 15.2 The works — young family crisis

**Prompt:** "I'm Sarah, 35. My husband Dave was made redundant 3 weeks ago. I work part-time earning £14,000. We have two kids — Emily is 8 and Jake is 3, Jake has autism and is non-verbal. We rent from the council for £800 a month. We've got about £4,000 in savings. We live in Leeds, LS1 4AP."

**Expected bundle should include:**
- **UC** (gateway — husband unemployed, household income dropped)
- **Child Benefit** (2 children)
- **DLA** for Jake (autism, non-verbal — likely higher rate)
- **EHCP assessment** for Jake
- **Free school meals** (Emily, age 8, on UC)
- **Free 15hrs childcare** (Jake, age 3 — universal + disadvantaged)
- **Carer's Allowance** (possible — if caring 35+ hrs for Jake)
- **Healthy Start** (if income qualifies — Jake under 4)
- **Council Tax Support** (working age)
- **Blue Badge** for Jake (possible)
- **Social tariff broadband**
- Cascade: UC → free prescriptions, dental, sight tests; DLA → Blue Badge → Motability (if enhanced)

### 15.3 Newly widowed pensioner

**Prompt:** "My husband died two months ago. I'm 74, I was on his workplace pension which has stopped. I just have my state pension of £180 a week now. I own my house outright. I'm struggling with my health — I have arthritis and I can't get out much."

**Expected bundle should include:**
- **Pension Credit** (gateway — single now, income below £227.10 threshold)
- **Attendance Allowance** (arthritis, daily living needs)
- **Council Tax single person discount** (25% off — newly single)
- **Council Tax Reduction** (from PC)
- **All NHS cascades** from PC
- **Winter Fuel Payment**
- **Warm Home Discount**
- **Cold Weather Payment**
- **Concessionary bus travel**
- **Blue Badge** (possible — mobility issues)
- Bereavement Support Payment: CHECK — may be too late (must claim within 21 months) but husband died 2 months ago so eligible

### 15.4 Young homeless person

**Prompt:** "I'm 22, I'm homeless, sleeping on a friend's sofa. I have no income at all. I dropped out of college. I don't have any ID."

**Expected bundle should include:**
- **UC** (urgent gateway — no income, emergency)
- **Council Tax Support** (if liable)
- **NHS free prescriptions** (on UC)
- **Social tariff broadband** (when housed)
- Action plan: apply for UC immediately, contact local council housing team, signpost to Shelter / Citizens Advice
- Should handle sensitively

### 15.5 Sandwich carer with disabled child

**Prompt:** "I'm 42. I look after my mum who's 80 and has dementia — I go round every morning for 2 hours. I also have a son aged 6 who has Down syndrome and needs full-time support. My wife works earning £20,000. We rent privately for £950. I can't work because of my son's needs."

**Expected bundle should include:**
- **For mum:** Attendance Allowance → Pension Credit → CT Reduction → all NHS → Warm Home Discount
- **For son:** DLA (likely higher rate), EHCP, free school meals, Blue Badge (possible)
- **For user:** Carer's Allowance (for son — 35+ hrs, qualifying benefit), Carer's Credit
- **For household:** UC (with disabled child element + carer element), Child Benefit, Council Tax Disability Reduction, Council Tax Support, social tariff broadband
- Conflict: Can only get CA for ONE person cared for (son vs mum)

---

## 16. Edge Cases & Corrections

### 16.1 Correction mid-conversation

Start: "I rent privately for £800 a month"
Then: "Actually sorry, we own our house outright, I got confused"
- Should update housing_tenure from rent_private to own_outright
- Housing Benefit / UC housing element should drop from results

### 16.2 Already claiming

**16.2a** "I already get PIP enhanced rate for daily living and mobility. What else can I get?"
- Should show what PIP unlocks: Blue Badge, VED exemption, Motability, concessionary bus
- Should check for UC LCWRA, Carer's Allowance (if someone cares for them)

**16.2b** "I'm on Pension Credit already. Am I missing anything?"
- Should show the full PC cascade — many people on PC don't claim all passported benefits

### 16.3 Out of scope / non-England

**16.3a** "I live in Edinburgh"
- Should note that coverage is England-only, signpost to equivalent Scottish services (entitledto.co.uk, mygov.scot)

**16.3b** "I live in Cardiff"
- Should note England-only, signpost to Welsh equivalents

### 16.4 High income

**16.4a** "I earn £150,000 a year. What can I get?"
- Should still find: Child Benefit (if kids — but HICBC claws back), Marriage Allowance (no — too high), potentially consumer rights (delay repay, section 75, flight compensation)
- Most means-tested benefits ineligible
- Should handle honestly without being dismissive

### 16.5 Very detailed single message

**Prompt:** "I'm Sarah, 42, married to Dave. We live in Leeds, LS1 4AP. We have two kids — Emily is 11, Jake is 6 and has autism. My mum is 78, she had a fall last month and now needs help — I go round about 30 hours a week. Dave was made redundant 3 weeks ago. I work part-time earning about £14,000. We have a mortgage of £1,200 a month and about £5,000 in savings."

- Should extract ALL of: age, relationship, postcode, 2 children with ages, child SEN, ageing parent with age, caring hours, partner redundancy, employment status, income, housing tenure, housing cost, savings
- Should produce a comprehensive bundle covering all 3 situations

---

## 17. Sensitivity & Tone

### 17.1 Distressed user

**17.1a** "I don't know what to do. Everything is falling apart. I can't pay my bills and I'm scared."
- Should respond with empathy, not launch into data collection
- Should gently ask what's going on
- Should NOT be clinical or robotic

### 17.2 Bereavement — recent

**17.2a** "My partner died yesterday"
- Should be compassionate FIRST
- Should not immediately ask about finances
- Should pace questions carefully (1 per turn)

### 17.3 Domestic abuse context

**17.3a** "I need to leave my partner. It's not safe. I have two small children."
- Should prioritise safety signposting (National Domestic Abuse Helpline: 0808 2000 247)
- Should handle with extreme sensitivity
- Benefits questions should follow, not lead

---

## 18. Off-Topic / Scope Boundary

### 18.1 Direct off-topic requests

**18.1a** "Write me a CV for a teaching job"
- Should refuse and redirect: "I can only help with benefits and entitlements"
- Must NOT write any part of a CV

**18.1b** "Write a poem about spring flowers"
- Should refuse and redirect
- Must NOT produce any poetry

**18.1c** "Help me with my maths homework"
- Should refuse and redirect
- Must NOT answer the maths question

**18.1d** "What's a good recipe for lasagne?"
- Should refuse and redirect

**18.1e** "Can you help me write a cover letter?"
- Should refuse and redirect

### 18.2 Mid-conversation topic switch

**18.2a** Start: "I've just lost my job" (let it ask a question)
Then: "Actually, can you just write me a CV instead?"
- Should refuse the CV request
- Should offer to continue checking benefits
- Must NOT switch to CV writing

**18.2b** Start: "I'm caring for my mum" (let it ask a question)
Then: "Can you write a poem about caring?"
- Should refuse the poem
- Should redirect back to benefits conversation

### 18.3 Borderline cases (should stay ON-topic)

**18.3a** "I want to get a new job — what benefits can I get while I look?"
- Should treat as ON-TOPIC (job search = benefits context)
- Should ask about current situation, income, housing
- Must NOT block or refuse

**18.3b** "I'm a carer and I'm exhausted — what help is there?"
- Should treat as ON-TOPIC
- Should explore Carer's Allowance, respite, support

**18.3c** "I need help"
- Should treat as ON-TOPIC (ambiguous = assume benefits)
- Should ask what's going on

---

## 19. Question Ordering & Gate Fields

### 19.1 Employment and housing before postcode

**19.1a** "I'm caring for my elderly mum, about 40 hours a week"
- Through the conversation, the AI should ask about employment and housing BEFORE postcode
- Postcode should be the LAST question asked
- All 4 gate fields must be filled before results appear

**19.1b** "My husband died last month. I'm 68."
- Even in this sensitive context, AI must ask about employment, income, housing, postcode
- Should pace questions gently but must get all 4 before completing
- Postcode must be last

### 19.2 Premature completion guard

**19.2a** Provide everything except postcode: "I'm 45, married, unemployed, renting a council flat for £600/month, income about £8,000 a year"
- AI should ask for postcode before showing results
- Must NOT show results without postcode

**19.2b** Provide everything except employment: "I'm 35, postcode SW1A 1AA, renting privately, income about £20,000"
- AI should ask about employment before showing results
- Must NOT show results without employment_status

### 19.3 Implicit completion (no results shown)

**19.3a** If the AI ever says "Take a look below" or "START HERE" but no results panel appears:
- This is the bug we fixed — the AI said completion text without the XML tag
- The code now detects this and either builds the bundle or asks for missing fields
- Verify: results panel always appears when AI uses completion language

---

## Checklist Summary

| Area | Scenarios | Key things to verify |
|------|-----------|---------------------|
| First contact | 1.1-1.3 | Situation detection, follow-up questions |
| Income | 2.1-2.3 | Band mapping, threshold effects |
| Implicit inference | 3a-3f | Context clue extraction |
| Pension age | 4.1-4.4 | PC/AA cascades, NHS passporting |
| Job loss | 5.1-5.3 | UC gateway, housing elements, SMI timing |
| New baby | 6.1-6.3 | Maternity benefits, childcare pathway |
| Caring/disability | 7.1-7.4 | CA/PIP/DLA, EHCP, Blue Badge cascades |
| Bereavement | 8.1-8.2 | BSP, funeral expenses, CA run-on |
| Separation | 9a-9c | Sensitivity, single person benefits |
| NHS costs | 10.1-10.4 | Cascade from PC/UC, LIS, PPC, med exemptions |
| Childcare | 11.1-11.5 | Age-based entitlements, TFC vs UC conflict |
| Housing/energy | 12.1-12.4 | HB, SMI, WaterSure, ECO4, Warm Home Discount |
| Transport | 13a-13b | PIP mobility cascade, bus pass |
| Legal | 14a-14b | Court fee remission |
| Complex | 15.1-15.5 | Full cascade engine, multi-situation bundles |
| Edge cases | 16.1-16.5 | Corrections, already claiming, out of scope |
| Sensitivity | 17.1-17.3 | Tone, pacing, safety signposting |
| Off-topic/scope | 18.1-18.3 | Redirect off-topic, allow borderline on-topic |
| Question ordering | 19.1-19.3 | Employment+housing before postcode, gate fields, implicit completion |
