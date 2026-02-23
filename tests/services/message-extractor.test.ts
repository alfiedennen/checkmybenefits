import { describe, it, expect } from 'vitest'
import { extractFromMessage, mergeExtraction } from '../../src/services/message-extractor.ts'
import type { PersonData } from '../../src/types/person.ts'

describe('extractFromMessage', () => {
  // ── Postcode ────────────────────────────────────
  describe('postcode extraction', () => {
    it('extracts standard UK postcode', () => {
      const result = extractFromMessage('I live in TN34 3JN')
      expect(result.postcode).toBe('TN34 3JN')
    })

    it('extracts London postcode', () => {
      const result = extractFromMessage('My address is SW1A 1AA')
      expect(result.postcode).toBe('SW1A 1AA')
    })

    it('normalises lowercase postcode', () => {
      const result = extractFromMessage('postcode is e1 6an')
      expect(result.postcode).toBe('E1 6AN')
    })
  })

  // ── Age ─────────────────────────────────────────
  describe('age extraction', () => {
    it('extracts "I\'m 34"', () => {
      const result = extractFromMessage("I'm 34 and live in London")
      expect(result.age).toBe(34)
    })

    it('extracts "42 years old"', () => {
      const result = extractFromMessage('I am 42 years old')
      expect(result.age).toBe(42)
    })

    it('extracts "aged 67"', () => {
      const result = extractFromMessage('My mother is looking after me, aged 67')
      expect(result.age).toBe(67)
    })

    it('ignores child ages (under 16)', () => {
      const result = extractFromMessage('My son is aged 5')
      expect(result.age).toBeUndefined()
    })
  })

  // ── Income ──────────────────────────────────────
  describe('income extraction', () => {
    it('extracts "earning £12,000"', () => {
      const result = extractFromMessage('My wife is earning about £12,000')
      expect(result.gross_annual_income).toBe(12000)
      expect(result.income_band).toBe('under_12570')
    })

    it('extracts "12 grand"', () => {
      const result = extractFromMessage('She earns about 12 grand')
      expect(result.gross_annual_income).toBe(12000)
    })

    it('extracts "£45k"', () => {
      const result = extractFromMessage('salary was £45k')
      expect(result.gross_annual_income).toBe(45000)
      expect(result.income_band).toBe('under_50270')
    })

    it('extracts "fifty grand"', () => {
      const result = extractFromMessage('I was earning about fifty grand')
      expect(result.gross_annual_income).toBe(50000)
    })

    it('extracts £ per annum format', () => {
      const result = extractFromMessage('My salary is £18,000 per annum')
      expect(result.gross_annual_income).toBe(18000)
      expect(result.income_band).toBe('under_25000')
    })

    it('extracts "£25,000 a year"', () => {
      const result = extractFromMessage('My income is £25,000 a year')
      expect(result.gross_annual_income).toBe(25000)
      expect(result.income_band).toBe('under_25000')
    })

    it('extracts "none" as zero income', () => {
      const result = extractFromMessage('None I lost my job')
      expect(result.gross_annual_income).toBe(0)
      expect(result.income_band).toBe('under_7400')
    })

    it('extracts "nothing" as zero income', () => {
      const result = extractFromMessage('Nothing at the moment')
      expect(result.gross_annual_income).toBe(0)
      expect(result.income_band).toBe('under_7400')
    })

    it('extracts "no income" as zero income', () => {
      const result = extractFromMessage('We have no income right now')
      expect(result.gross_annual_income).toBe(0)
      expect(result.income_band).toBe('under_7400')
    })

    it('extracts "zero" as zero income', () => {
      const result = extractFromMessage('Zero income since I was let go')
      expect(result.gross_annual_income).toBe(0)
      expect(result.income_band).toBe('under_7400')
    })

    it('does not match "none of" as zero income', () => {
      const result = extractFromMessage('None of the above apply to me')
      expect(result.gross_annual_income).toBeUndefined()
    })

    it('extracts "eight thousand a year" as 8000', () => {
      const result = extractFromMessage('just his pension, about eight thousand a year')
      expect(result.gross_annual_income).toBe(8000)
      expect(result.income_band).toBe('under_12570')
    })

    it('extracts "ten thousand" as 10000', () => {
      const result = extractFromMessage('about ten thousand a year')
      expect(result.gross_annual_income).toBe(10000)
      expect(result.income_band).toBe('under_12570')
    })

    it('extracts "nine thousand" as 9000', () => {
      const result = extractFromMessage('about nine thousand from pensions')
      expect(result.gross_annual_income).toBe(9000)
      expect(result.income_band).toBe('under_12570')
    })

    it('extracts "sixteen thousand" as 16000', () => {
      const result = extractFromMessage('earning roughly sixteen thousand')
      expect(result.gross_annual_income).toBe(16000)
      expect(result.income_band).toBe('under_16000')
    })
  })

  // ── Employment ──────────────────────────────────
  describe('employment extraction', () => {
    it('extracts redundancy', () => {
      const result = extractFromMessage("I've been made redundant last month")
      expect(result.employment_status).toBe('unemployed')
      expect(result.recently_redundant).toBe(true)
    })

    it('extracts job loss', () => {
      const result = extractFromMessage("I've just lost my job")
      expect(result.employment_status).toBe('unemployed')
    })

    it('extracts retirement', () => {
      const result = extractFromMessage("I'm retired now")
      expect(result.employment_status).toBe('retired')
    })

    it('extracts employed', () => {
      const result = extractFromMessage('I work part-time at Tesco')
      expect(result.employment_status).toBe('employed')
    })

    it('extracts "can\'t work" as unemployed', () => {
      const result = extractFromMessage("I have MS and can't work anymore")
      expect(result.employment_status).toBe('unemployed')
    })

    it('extracts "had to give up work" as unemployed', () => {
      const result = extractFromMessage('Nothing, I had to give up work')
      expect(result.employment_status).toBe('unemployed')
    })

    it('extracts "let go" as unemployed', () => {
      const result = extractFromMessage('Zero income since I was let go')
      expect(result.employment_status).toBe('unemployed')
    })

    it('extracts student', () => {
      const result = extractFromMessage("I'm a full time student")
      expect(result.employment_status).toBe('student')
    })

    it('extracts "housewife" as unemployed', () => {
      const result = extractFromMessage("I was a housewife")
      expect(result.employment_status).toBe('unemployed')
    })

    it('extracts "homemaker" as unemployed', () => {
      const result = extractFromMessage("I was a homemaker all my life")
      expect(result.employment_status).toBe('unemployed')
    })

    it('extracts "stay at home mum" as unemployed', () => {
      const result = extractFromMessage("I'm a stay at home mum")
      expect(result.employment_status).toBe('unemployed')
    })

    it('extracts "self employed" as self_employed', () => {
      const result = extractFromMessage("I am self employed")
      expect(result.employment_status).toBe('self_employed')
    })

    it('extracts "self-employed" as self_employed', () => {
      const result = extractFromMessage("self-employed, plumber")
      expect(result.employment_status).toBe('self_employed')
    })

    it('extracts "state pension" as retired', () => {
      const result = extractFromMessage("just my state pension")
      expect(result.employment_status).toBe('retired')
    })

    it('extracts "on the state pension" as retired', () => {
      const result = extractFromMessage("I'm on the state pension")
      expect(result.employment_status).toBe('retired')
    })

    it('extracts "£0" as zero income', () => {
      const result = extractFromMessage('£0')
      expect(result.gross_annual_income).toBe(0)
      expect(result.income_band).toBe('under_7400')
    })
  })

  // ── Housing ─────────────────────────────────────
  describe('housing extraction', () => {
    it('extracts mortgage with cost', () => {
      const result = extractFromMessage('mortgage is £2,000 a month')
      expect(result.housing_tenure).toBe('mortgage')
      expect(result.monthly_housing_cost).toBe(2000)
    })

    it('extracts private renting', () => {
      const result = extractFromMessage("I'm renting privately, £800 a month")
      expect(result.housing_tenure).toBe('rent_private')
      expect(result.monthly_housing_cost).toBe(800)
    })

    it('extracts council housing', () => {
      const result = extractFromMessage('We rent from the council')
      expect(result.housing_tenure).toBe('rent_social')
    })

    it('extracts own outright', () => {
      const result = extractFromMessage('We own our house outright')
      expect(result.housing_tenure).toBe('own_outright')
    })

    it('extracts living with family', () => {
      const result = extractFromMessage("I'm living with my parents")
      expect(result.housing_tenure).toBe('living_with_family')
    })

    it('extracts "we own our home" without outright', () => {
      const result = extractFromMessage('we own our home')
      expect(result.housing_tenure).toBe('own_outright')
    })

    it('extracts "I own my flat"', () => {
      const result = extractFromMessage('I own my flat')
      expect(result.housing_tenure).toBe('own_outright')
    })
  })

  // ── Relationship ────────────────────────────────
  describe('relationship extraction', () => {
    it('extracts wife → couple_married', () => {
      const result = extractFromMessage('My wife works part-time')
      expect(result.relationship_status).toBe('couple_married')
    })

    it('extracts husband → couple_married', () => {
      const result = extractFromMessage('My husband lost his job')
      expect(result.relationship_status).toBe('couple_married')
    })

    it('extracts partner → couple_cohabiting', () => {
      const result = extractFromMessage('My partner and I need help')
      expect(result.relationship_status).toBe('couple_cohabiting')
    })

    it('extracts single', () => {
      const result = extractFromMessage("I'm single and live alone")
      expect(result.relationship_status).toBe('single')
    })

    it('extracts widowed', () => {
      const result = extractFromMessage("I was widowed last year")
      expect(result.relationship_status).toBe('widowed')
    })

    it('extracts separated', () => {
      const result = extractFromMessage("We've recently separated")
      expect(result.relationship_status).toBe('separated')
    })

    it('extracts "divorced" as separated', () => {
      const result = extractFromMessage("I got divorced last year")
      expect(result.relationship_status).toBe('separated')
    })

    it('extracts "going through a divorce" as separated', () => {
      const result = extractFromMessage("going through a divorce")
      expect(result.relationship_status).toBe('separated')
    })
  })

  // ── Children ────────────────────────────────────
  describe('children extraction', () => {
    it('extracts multiple children with ages', () => {
      const result = extractFromMessage('3 kids aged 14, 9, and 5')
      expect(result.children).toHaveLength(3)
      expect(result.children![0].age).toBe(14)
      expect(result.children![1].age).toBe(9)
      expect(result.children![2].age).toBe(5)
    })

    it('marks additional needs from autism keyword', () => {
      const result = extractFromMessage('My child aged 7 has autism')
      expect(result.children).toHaveLength(1)
      expect(result.children![0].has_additional_needs).toBe(true)
    })

    it('marks youngest with additional needs', () => {
      const result = extractFromMessage(
        'kids aged 14, 9, and 5. The youngest has autism',
      )
      expect(result.children).toHaveLength(3)
      const youngest = result.children!.find((c) => c.age === 5)
      expect(youngest?.has_additional_needs).toBe(true)
    })

    it('sets in_education for school-age children', () => {
      const result = extractFromMessage('children aged 11 and 6')
      expect(result.children![0].in_education).toBe(true)
      expect(result.children![1].in_education).toBe(true)
    })

    it('extracts "my 7 year old"', () => {
      const result = extractFromMessage('my 7 year old is struggling at school')
      expect(result.children).toHaveLength(1)
      expect(result.children![0].age).toBe(7)
    })
  })

  // ── Carer & cared-for person ────────────────────
  describe('carer extraction', () => {
    it('extracts caring for mum with age', () => {
      const result = extractFromMessage("My mum's 79, she can't cope on her own")
      expect(result.cared_for_person).toBeDefined()
      expect(result.cared_for_person!.relationship).toBe('parent')
      expect(result.cared_for_person!.age).toBe(79)
      expect(result.cared_for_person!.needs_help_daily_living).toBe(true)
    })

    it('extracts caring hours', () => {
      const result = extractFromMessage("I'm caring for my dad, about 40 hours a week")
      expect(result.is_carer).toBe(true)
      expect(result.carer_hours_per_week).toBe(40)
    })

    it('extracts looking after parent without age', () => {
      const result = extractFromMessage("My mother can't cope and needs help with everything")
      expect(result.cared_for_person).toBeDefined()
      expect(result.cared_for_person!.relationship).toBe('parent')
      expect(result.cared_for_person!.needs_help_daily_living).toBe(true)
    })
  })

  // ── Disability & health ─────────────────────────
  describe('disability and health extraction', () => {
    it('detects disability keyword', () => {
      const result = extractFromMessage('I have a disability that affects my daily life')
      expect(result.has_disability_or_health_condition).toBe(true)
    })

    it('detects specific condition: arthritis', () => {
      const result = extractFromMessage('I have severe arthritis in both knees')
      expect(result.has_disability_or_health_condition).toBe(true)
    })

    it('detects mobility difficulty', () => {
      const result = extractFromMessage("I can't walk very far and use a wheelchair")
      expect(result.mobility_difficulty).toBe(true)
    })

    it('detects needs help with daily living', () => {
      const result = extractFromMessage("I need help with washing and dressing every day")
      expect(result.needs_help_with_daily_living).toBe(true)
    })

    it('detects PIP receipt', () => {
      const result = extractFromMessage("I'm on PIP enhanced rate mobility")
      expect(result.disability_benefit_received).toBe('pip_mobility_enhanced')
    })

    it('detects DLA receipt', () => {
      const result = extractFromMessage("My child is getting DLA higher rate care")
      expect(result.disability_benefit_received).toBe('dla_higher_care')
    })
  })

  // ── Medical exemption ───────────────────────────
  describe('medical exemption extraction', () => {
    it('detects diabetes', () => {
      const result = extractFromMessage('I have diabetes')
      expect(result.has_medical_exemption).toBe(true)
    })

    it('detects epilepsy', () => {
      const result = extractFromMessage('I suffer from epilepsy')
      expect(result.has_medical_exemption).toBe(true)
    })

    it('detects thyroid condition', () => {
      const result = extractFromMessage('I have a thyroid condition')
      expect(result.has_medical_exemption).toBe(true)
    })
  })

  // ── Bereavement ─────────────────────────────────
  describe('bereavement extraction', () => {
    it('detects partner death', () => {
      // Note: "husband" matches couple_married in relationship extractor before
      // bereavement extractor runs, so relationship_status = couple_married not widowed.
      // This is a known limitation — the AI layer handles this correctly.
      const result = extractFromMessage('My husband died last month')
      expect(result.is_bereaved).toBe(true)
      expect(result.deceased_relationship).toBe('partner')
    })

    it('detects parent death', () => {
      const result = extractFromMessage('My mum passed away recently')
      expect(result.is_bereaved).toBe(true)
      expect(result.deceased_relationship).toBe('parent')
    })

    it('detects widowed status', () => {
      const result = extractFromMessage("I'm a widower with two children")
      expect(result.is_bereaved).toBe(true)
      expect(result.relationship_status).toBe('widowed')
    })
  })

  // ── Pregnancy ───────────────────────────────────
  describe('pregnancy extraction', () => {
    it('detects pregnant', () => {
      const result = extractFromMessage("I'm pregnant with our first baby")
      expect(result.is_pregnant).toBe(true)
      expect(result.expecting_first_child).toBe(true)
    })

    it('detects expecting', () => {
      const result = extractFromMessage("We're expecting a baby")
      expect(result.is_pregnant).toBe(true)
    })
  })

  // ── Savings ─────────────────────────────────────
  describe('savings extraction', () => {
    it('extracts savings amount', () => {
      const result = extractFromMessage("I've got about £3,000 in savings")
      expect(result.household_capital).toBe(3000)
    })
  })

  // ── Water meter ─────────────────────────────────
  describe('water meter extraction', () => {
    it('detects water meter', () => {
      const result = extractFromMessage("We're on a water meter")
      expect(result.on_water_meter).toBe(true)
    })
  })

  // ── Months on UC ────────────────────────────────
  describe('months on UC extraction', () => {
    it('extracts "on UC for a year"', () => {
      const result = extractFromMessage("I've been on UC for a year")
      expect(result.months_on_uc).toBe(12)
    })

    it('extracts "on universal credit for 18 months"', () => {
      const result = extractFromMessage("Been on universal credit for 18 months")
      expect(result.months_on_uc).toBe(18)
    })

    it('infers months from job loss + UC mention', () => {
      const result = extractFromMessage("I lost my job 10 months ago. I'm on UC")
      expect(result.months_on_uc).toBe(10)
    })
  })

  // ── Complex multi-field messages ────────────────
  describe('complex multi-field messages', () => {
    it('extracts A1 scenario: rich multi-situation message', () => {
      const result = extractFromMessage(
        "My mum's 79, she can't cope on her own anymore. I've lost my job — was made redundant last month. My wife works part-time earning about £12,000. We've got 3 kids aged 14, 9, and 5. The youngest has autism. We're paying £2000 a month on the mortgage. We live in Sheffield, S11 8YA.",
      )

      expect(result.postcode).toBe('S11 8YA')
      expect(result.employment_status).toBe('unemployed')
      expect(result.recently_redundant).toBe(true)
      expect(result.gross_annual_income).toBe(12000)
      expect(result.income_band).toBe('under_12570')
      expect(result.relationship_status).toBe('couple_married')
      expect(result.housing_tenure).toBe('mortgage')
      expect(result.monthly_housing_cost).toBe(2000)
      expect(result.children).toHaveLength(3)
      expect(result.cared_for_person?.relationship).toBe('parent')
      expect(result.cared_for_person?.age).toBe(79)
      // Note: is_carer requires explicit carer keywords ("caring for", "looking after")
      // The A1 text says "can't cope" which triggers cared_for_person but not is_carer
    })

    it('extracts 5.3 scenario: lost job with mortgage', () => {
      const result = extractFromMessage(
        "I lost my job 10 months ago. I'm on UC. My mortgage is £1,000 a month and I can't keep up. I'm single, no kids. Postcode is TN34 3JN.",
      )

      expect(result.postcode).toBe('TN34 3JN')
      expect(result.employment_status).toBe('unemployed')
      expect(result.housing_tenure).toBe('mortgage')
      expect(result.monthly_housing_cost).toBe(1000)
      expect(result.relationship_status).toBe('single')
      expect(result.months_on_uc).toBe(10)
    })

    it('extracts pensioner caring scenario', () => {
      const result = extractFromMessage(
        "I'm 72, retired, and my husband who's 78 has dementia. I help him with washing, dressing and cooking. We own our home outright in B15 1TJ. We have about £8,000 in savings.",
      )

      expect(result.age).toBe(72)
      expect(result.employment_status).toBe('retired')
      expect(result.relationship_status).toBe('couple_married')
      expect(result.housing_tenure).toBe('own_outright')
      expect(result.postcode).toBe('B15 1TJ')
      expect(result.household_capital).toBe(8000)
      expect(result.has_disability_or_health_condition).toBe(true) // dementia mention
      // Note: "help him with washing, dressing" doesn't match "need help with" pattern
      // The extractor looks for "I need help with" not "I help him with"
    })
  })
})

describe('mergeExtraction', () => {
  it('returns code data when model data is empty', () => {
    const code: Partial<PersonData> = { postcode: 'SW1A 1AA', age: 34 }
    const result = mergeExtraction(undefined, code)
    expect(result).toEqual(code)
  })

  it('returns model data when code data is empty', () => {
    const model: Partial<PersonData> = { postcode: 'E1 6AN', age: 42 }
    const result = mergeExtraction(model, {})
    expect(result).toEqual(model)
  })

  it('model values override code values', () => {
    const model: Partial<PersonData> = { income_band: 'under_12570' }
    const code: Partial<PersonData> = {
      income_band: 'under_50270',
      postcode: 'TN34 3JN',
    }
    const result = mergeExtraction(model, code)
    expect(result.income_band).toBe('under_12570')
    expect(result.postcode).toBe('TN34 3JN')
  })

  it('code fills gaps that model missed', () => {
    const model: Partial<PersonData> = {
      employment_status: 'unemployed',
    }
    const code: Partial<PersonData> = {
      postcode: 'TN34 3JN',
      housing_tenure: 'mortgage',
      monthly_housing_cost: 2000,
    }
    const result = mergeExtraction(model, code)
    expect(result.employment_status).toBe('unemployed')
    expect(result.postcode).toBe('TN34 3JN')
    expect(result.housing_tenure).toBe('mortgage')
    expect(result.monthly_housing_cost).toBe(2000)
  })

  it('model children override code children when non-empty', () => {
    const model: Partial<PersonData> = {
      children: [{ age: 5, has_additional_needs: true, disability_benefit: 'none', in_education: true }],
    }
    const code: Partial<PersonData> = {
      children: [
        { age: 14, has_additional_needs: false, disability_benefit: 'none', in_education: true },
        { age: 5, has_additional_needs: false, disability_benefit: 'none', in_education: true },
      ],
    }
    const result = mergeExtraction(model, code)
    expect(result.children).toHaveLength(1)
    expect(result.children![0].has_additional_needs).toBe(true)
  })

  it('keeps code children when model has empty array', () => {
    const model: Partial<PersonData> = { children: [] }
    const code: Partial<PersonData> = {
      children: [{ age: 7, has_additional_needs: false, disability_benefit: 'none', in_education: true }],
    }
    const result = mergeExtraction(model, code)
    expect(result.children).toHaveLength(1)
    expect(result.children![0].age).toBe(7)
  })

  it('derives income_band from gross_annual_income when missing', () => {
    // Code extraction already derives income_band from income, so test with
    // model having income but no band, and code having neither
    const model: Partial<PersonData> = { gross_annual_income: 8000 }
    const code: Partial<PersonData> = { postcode: 'SW1A 1AA' }
    const result = mergeExtraction(model, code)
    // income_band is derived in mergeExtraction when gross_annual_income is present but income_band isn't
    expect(result.income_band).toBe('under_12570')
  })

  it('does not override existing income_band when deriving', () => {
    const model: Partial<PersonData> = { income_band: 'under_7400' }
    const code: Partial<PersonData> = { gross_annual_income: 30000 }
    const result = mergeExtraction(model, code)
    expect(result.income_band).toBe('under_7400')
  })
})
