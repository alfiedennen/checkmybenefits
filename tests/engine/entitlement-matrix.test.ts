/**
 * Entitlement Matrix Test Suite
 * Comprehensive generative persona matrix tests for the eligibility engine.
 * Each test feeds PersonData directly into buildBundle() - no AI calls.
 */
import { describe, it, expect } from 'vitest'
import { buildBundle } from '../../src/engine/bundle-builder.ts'
import { createEmptyPerson } from '../../src/types/person.ts'
import type { PersonData } from '../../src/types/person.ts'
import type { SituationId } from '../../src/types/conversation.ts'

function getAllIds(bundle: Awaited<ReturnType<typeof buildBundle>>): string[] {
  return [
    ...bundle.gateway_entitlements.map((e) => e.id),
    ...bundle.independent_entitlements.map((e) => e.id),
    ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements.map((e) => e.id)),
  ]
}

function makePerson(overrides: Partial<PersonData>): PersonData {
  return { ...createEmptyPerson(), ...overrides }
}

const ALL_SITUATIONS: SituationId[] = ['lost_job', 'new_baby', 'ageing_parent', 'disability', 'bereavement', 'struggling_financially']

const universalPersona: Partial<PersonData> = {
  age: 70,
  employment_status: 'retired',
  income_band: 'under_12570',
  housing_tenure: 'own_outright',
  relationship_status: 'single',
  children: [],
  has_disability_or_health_condition: true,
  needs_help_with_daily_living: true,
  mobility_difficulty: true,
  is_carer: false,
  is_pregnant: false,
  is_bereaved: false,
  household_capital: 5000,
  gross_annual_income: 8000,
}

describe('Group A: Nation Filtering', () => {
  describe('England persona', () => {
    it('excludes Scotland-only entitlements', async () => {
      const b = await buildBundle(makePerson({ ...universalPersona, nation: 'england', postcode: 'SW1A 1AA' }), ALL_SITUATIONS)
      const ids = getAllIds(b)
      expect(ids, 'scottish_child_payment absent').not.toContain('scottish_child_payment')
      expect(ids, 'adult_disability_payment absent').not.toContain('adult_disability_payment')
      expect(ids, 'pension_age_disability_payment absent').not.toContain('pension_age_disability_payment')
      expect(ids, 'winter_heating_payment absent').not.toContain('winter_heating_payment')
      expect(ids, 'council_tax_reduction_scotland absent').not.toContain('council_tax_reduction_scotland')
      expect(ids, 'free_bus_travel_scotland absent').not.toContain('free_bus_travel_scotland')
    })

    it('excludes Wales-only entitlements', async () => {
      const b = await buildBundle(makePerson({ ...universalPersona, nation: 'england', postcode: 'SW1A 1AA' }), ALL_SITUATIONS)
      const ids = getAllIds(b)
      expect(ids, 'council_tax_reduction_wales absent').not.toContain('council_tax_reduction_wales')
      expect(ids, 'childcare_offer_wales absent').not.toContain('childcare_offer_wales')
      expect(ids, 'flying_start_wales absent').not.toContain('flying_start_wales')
      expect(ids, 'pupil_development_grant_wales absent').not.toContain('pupil_development_grant_wales')
      expect(ids, 'school_essentials_grant_wales absent').not.toContain('school_essentials_grant_wales')
      expect(ids, 'discretionary_assistance_fund_wales absent').not.toContain('discretionary_assistance_fund_wales')
      expect(ids, 'help_to_stay_wales absent').not.toContain('help_to_stay_wales')
      expect(ids, 'welsh_government_fuel_support absent').not.toContain('welsh_government_fuel_support')
    })
  })

  describe('Scotland persona', () => {
    it('includes Scotland-only entitlements', async () => {
      const b = await buildBundle(makePerson({ ...universalPersona, nation: 'scotland', postcode: 'EH1 1YZ' }), ALL_SITUATIONS)
      const ids = getAllIds(b)
      expect(ids, 'pension_age_disability_payment present').toContain('pension_age_disability_payment')
      expect(ids, 'winter_heating_payment present').toContain('winter_heating_payment')
      expect(ids, 'council_tax_reduction_scotland present').toContain('council_tax_reduction_scotland')
      expect(ids, 'free_bus_travel_scotland present').toContain('free_bus_travel_scotland')
    })

    it('excludes England-only entitlements', async () => {
      const b = await buildBundle(makePerson({ ...universalPersona, nation: 'scotland', postcode: 'EH1 1YZ' }), ALL_SITUATIONS)
      const ids = getAllIds(b)
      expect(ids, 'council_tax_support_working_age absent').not.toContain('council_tax_support_working_age')
      expect(ids, 'ehcp_assessment absent').not.toContain('ehcp_assessment')
      expect(ids, 'free_childcare_15hrs_universal absent').not.toContain('free_childcare_15hrs_universal')
      expect(ids, 'free_childcare_15hrs_disadvantaged absent').not.toContain('free_childcare_15hrs_disadvantaged')
      expect(ids, 'free_childcare_30hrs absent').not.toContain('free_childcare_30hrs')
      expect(ids, '16_19_bursary absent').not.toContain('16_19_bursary')
    })
  })

  describe('Wales persona', () => {
    it('includes Wales-only entitlements', async () => {
      const b = await buildBundle(makePerson({ ...universalPersona, nation: 'wales', postcode: 'CF10 1AA' }), ALL_SITUATIONS)
      const ids = getAllIds(b)
      expect(ids, 'council_tax_reduction_wales present').toContain('council_tax_reduction_wales')
      expect(ids, 'help_to_stay_wales present').toContain('help_to_stay_wales')
      expect(ids, 'welsh_government_fuel_support present').toContain('welsh_government_fuel_support')
      expect(ids, 'discretionary_assistance_fund_wales present').toContain('discretionary_assistance_fund_wales')
    })

    it('includes England+Wales entitlements', async () => {
      const b = await buildBundle(makePerson({ ...universalPersona, nation: 'wales', postcode: 'CF10 1AA' }), ALL_SITUATIONS)
      const ids = getAllIds(b)
      expect(ids, 'cold_weather_payment present').toContain('cold_weather_payment')
    })

    it('excludes England-only entitlements', async () => {
      const b = await buildBundle(makePerson({ ...universalPersona, nation: 'wales', postcode: 'CF10 1AA' }), ALL_SITUATIONS)
      const ids = getAllIds(b)
      expect(ids, 'council_tax_support_working_age absent').not.toContain('council_tax_support_working_age')
      expect(ids, 'ehcp_assessment absent').not.toContain('ehcp_assessment')
      expect(ids, 'free_childcare_15hrs_universal absent').not.toContain('free_childcare_15hrs_universal')
      expect(ids, 'free_childcare_30hrs absent').not.toContain('free_childcare_30hrs')
      expect(ids, '16_19_bursary absent').not.toContain('16_19_bursary')
    })
  })
})

describe('Group B: Entitlement Inclusion (Golden Personas)', () => {
  describe('Retired pensioner (70, single, low income)', () => {
    it('pension_credit', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000,'has_disability_or_health_condition':true,'needs_help_with_daily_living':true}), ['disability','struggling_financially'])
      expect(getAllIds(b)).toContain('pension_credit')
    })

    it('attendance_allowance', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000,'has_disability_or_health_condition':true,'needs_help_with_daily_living':true}), ['disability'])
      expect(getAllIds(b)).toContain('attendance_allowance')
    })

    it('winter_fuel_payment', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('winter_fuel_payment')
    })

    it('council_tax_single_person_discount', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('council_tax_single_person_discount')
    })

    it('concessionary_bus_travel', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('concessionary_bus_travel')
    })

    it('warm_home_discount', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('warm_home_discount')
    })

    it('council_tax_disability_reduction', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000,'has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(b)).toContain('council_tax_disability_reduction')
    })

    it('free_nhs_prescriptions', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('free_nhs_prescriptions')
    })

    it('free_nhs_sight_tests', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('free_nhs_sight_tests')
    })

    it('blue_badge with mobility', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000,'mobility_difficulty':true}), ['disability'])
      expect(getAllIds(b)).toContain('blue_badge')
    })

    it('council_tax_reduction_full', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('council_tax_reduction_full')
    })

    it('housing_benefit_legacy when renting', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('housing_benefit_legacy')
    })

  })

  describe('Young unemployed parent (25, single)', () => {
    it('universal_credit', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['lost_job','struggling_financially'])
      expect(getAllIds(b)).toContain('universal_credit')
    })

    it('child_benefit', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('child_benefit')
    })

    it('free_school_meals', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':6}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('free_school_meals')
    })

    it('healthy_start', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':2}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('healthy_start')
    })

    it('free_childcare_15hrs_universal', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('free_childcare_15hrs_universal')
    })

    it('free_childcare_15hrs_disadvantaged', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':2}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('free_childcare_15hrs_disadvantaged')
    })

    it('council_tax_single_person_discount', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('council_tax_single_person_discount')
    })

    it('social_tariff_broadband', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('social_tariff_broadband')
    })

    it('eco_home_insulation', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('eco_home_insulation')
    })

    it('council_tax_support_working_age', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('council_tax_support_working_age')
    })

  })

  describe('Working-age disabled person (40, PIP)', () => {
    it('pip', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(b)).toContain('pip')
    })

    it('blue_badge with enhanced mobility', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true,'disability_benefit_received':'pip_mobility_enhanced'}), ['disability'])
      expect(getAllIds(b)).toContain('blue_badge')
    })

    it('vehicle_excise_duty_exemption', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true,'disability_benefit_received':'pip_mobility_enhanced'}), ['disability'])
      expect(getAllIds(b)).toContain('vehicle_excise_duty_exemption')
    })

    it('motability_scheme', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true,'disability_benefit_received':'pip_mobility_enhanced'}), ['disability'])
      expect(getAllIds(b)).toContain('motability_scheme')
    })

    it('council_tax_disability_reduction', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(b)).toContain('council_tax_disability_reduction')
    })

    it('universal_credit', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true}), ['disability','struggling_financially'])
      expect(getAllIds(b)).toContain('universal_credit')
    })

  })

  describe('Carer for elderly parent (45)', () => {
    it('carers_allowance', async () => {
      const b = await buildBundle(makePerson({'age':45,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'is_carer':true,'carer_hours_per_week':40,'cared_for_person':{'age':75,'needs_help_daily_living':true}}), ['ageing_parent'])
      expect(getAllIds(b)).toContain('carers_allowance')
    })

    it('carers_credit', async () => {
      const b = await buildBundle(makePerson({'age':45,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'is_carer':true,'carer_hours_per_week':25,'cared_for_person':{'age':75,'needs_help_daily_living':true}}), ['ageing_parent'])
      expect(getAllIds(b)).toContain('carers_credit')
    })

    it('attendance_allowance for cared-for person', async () => {
      const b = await buildBundle(makePerson({'age':45,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'is_carer':true,'carer_hours_per_week':40,'cared_for_person':{'age':75,'needs_help_daily_living':true}}), ['ageing_parent'])
      expect(getAllIds(b)).toContain('attendance_allowance')
    })

    it('pension_credit for cared-for person', async () => {
      const b = await buildBundle(makePerson({'age':45,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'is_carer':true,'carer_hours_per_week':40,'cared_for_person':{'age':75,'needs_help_daily_living':true}}), ['ageing_parent'])
      expect(getAllIds(b)).toContain('pension_credit')
    })

  })

  describe('Pregnant woman (28)', () => {
    it('maternity_allowance (self-employed)', async () => {
      const b = await buildBundle(makePerson({'age':28,'nation':'england','employment_status':'self_employed','income_band':'under_25000','housing_tenure':'rent_private','relationship_status':'couple_married','children':[],'is_pregnant':true,'expecting_first_child':true}), ['new_baby'])
      expect(getAllIds(b)).toContain('maternity_allowance')
    })

    it('child_benefit', async () => {
      const b = await buildBundle(makePerson({'age':28,'nation':'england','employment_status':'self_employed','income_band':'under_25000','housing_tenure':'rent_private','relationship_status':'couple_married','children':[],'is_pregnant':true}), ['new_baby'])
      expect(getAllIds(b)).toContain('child_benefit')
    })

    it('maternity_exemption_cert', async () => {
      const b = await buildBundle(makePerson({'age':28,'nation':'england','employment_status':'self_employed','income_band':'under_25000','housing_tenure':'rent_private','relationship_status':'couple_married','children':[],'is_pregnant':true}), ['new_baby'])
      expect(getAllIds(b)).toContain('maternity_exemption_cert')
    })

    it('free_nhs_prescriptions when pregnant', async () => {
      const b = await buildBundle(makePerson({'age':28,'nation':'england','employment_status':'self_employed','income_band':'under_25000','housing_tenure':'rent_private','relationship_status':'couple_married','children':[],'is_pregnant':true}), ['new_baby'])
      expect(getAllIds(b)).toContain('free_nhs_prescriptions')
    })

    it('free_nhs_dental when pregnant', async () => {
      const b = await buildBundle(makePerson({'age':28,'nation':'england','employment_status':'self_employed','income_band':'under_25000','housing_tenure':'rent_private','relationship_status':'couple_married','children':[],'is_pregnant':true}), ['new_baby'])
      expect(getAllIds(b)).toContain('free_nhs_dental')
    })

    it('sure_start_maternity_grant (first child, low income)', async () => {
      const b = await buildBundle(makePerson({'age':28,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'is_pregnant':true,'expecting_first_child':true}), ['new_baby','struggling_financially'])
      expect(getAllIds(b)).toContain('sure_start_maternity_grant')
    })

    it('healthy_start when pregnant low income', async () => {
      const b = await buildBundle(makePerson({'age':28,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'is_pregnant':true}), ['new_baby','struggling_financially'])
      expect(getAllIds(b)).toContain('healthy_start')
    })

    it('free_childcare_30hrs when working', async () => {
      const b = await buildBundle(makePerson({'age':28,'nation':'england','employment_status':'employed','income_band':'under_50270','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':3}]}), ['new_baby'])
      expect(getAllIds(b)).toContain('free_childcare_30hrs')
    })

    it('tax_free_childcare when working', async () => {
      const b = await buildBundle(makePerson({'age':28,'nation':'england','employment_status':'employed','income_band':'under_50270','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':3}]}), ['new_baby'])
      expect(getAllIds(b)).toContain('tax_free_childcare')
    })

  })

  describe('Bereaved spouse (55, widowed)', () => {
    it('bereavement_support_payment', async () => {
      const b = await buildBundle(makePerson({'age':55,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'own_outright','relationship_status':'widowed','children':[],'is_bereaved':true,'deceased_relationship':'partner'}), ['bereavement'])
      expect(getAllIds(b)).toContain('bereavement_support_payment')
    })

    it('council_tax_single_person_discount', async () => {
      const b = await buildBundle(makePerson({'age':55,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'own_outright','relationship_status':'widowed','children':[]}), ['bereavement'])
      expect(getAllIds(b)).toContain('council_tax_single_person_discount')
    })

    it('funeral_expenses_payment (low income)', async () => {
      const b = await buildBundle(makePerson({'age':55,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'widowed','children':[],'is_bereaved':true}), ['bereavement','struggling_financially'])
      expect(getAllIds(b)).toContain('funeral_expenses_payment')
    })

  })

  describe('Married couple', () => {
    it('marriage_allowance', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('marriage_allowance')
    })

  })

  describe('Student (21)', () => {
    it('student_maintenance_loan', async () => {
      const b = await buildBundle(makePerson({'age':21,'nation':'england','employment_status':'student','income_band':'under_7400','housing_tenure':'rent_private','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('student_maintenance_loan')
    })

    it('childcare_grant_students with children', async () => {
      const b = await buildBundle(makePerson({'age':21,'nation':'england','employment_status':'student','income_band':'under_7400','housing_tenure':'rent_private','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('childcare_grant_students')
    })

  })

  describe('Parent of child with additional needs', () => {
    it('dla_child', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':8,'has_additional_needs':true}]}), ['disability'])
      expect(getAllIds(b)).toContain('dla_child')
    })

    it('ehcp_assessment', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':8,'has_additional_needs':true}]}), ['disability'])
      expect(getAllIds(b)).toContain('ehcp_assessment')
    })

  })

  describe('Miscellaneous personas', () => {
    it('support_mortgage_interest after 9mo', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'mortgage','relationship_status':'single','children':[],'months_on_uc':10}), ['lost_job','struggling_financially'])
      expect(getAllIds(b)).toContain('support_mortgage_interest')
    })

    it('watersure with water meter and medical need', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'has_disability_or_health_condition':true,'on_water_meter':true}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('watersure')
    })

    it('ni_voluntary_contributions (age 55)', async () => {
      const b = await buildBundle(makePerson({'age':55,'nation':'england','employment_status':'employed','income_band':'under_50270','housing_tenure':'own_outright','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('ni_voluntary_contributions')
    })

    it('nhs_low_income_scheme on moderate income', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'employed','income_band':'under_16000','housing_tenure':'rent_private','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('nhs_low_income_scheme')
    })

  })

  describe('Scotland-specific personas', () => {
    it('scottish_child_payment', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':5}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('scottish_child_payment')
    })

    it('best_start_grant (pregnant, low income)', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'is_pregnant':true}), ['new_baby'])
      expect(getAllIds(b)).toContain('best_start_grant')
    })

    it('best_start_foods', async () => {
      const b = await buildBundle(makePerson({'age':25,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'is_pregnant':true}), ['new_baby'])
      expect(getAllIds(b)).toContain('best_start_foods')
    })

    it('adult_disability_payment', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(b)).toContain('adult_disability_payment')
    })

    it('carer_support_payment', async () => {
      const b = await buildBundle(makePerson({'age':45,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'is_carer':true,'carer_hours_per_week':40,'cared_for_person':{'age':75,'needs_help_daily_living':true}}), ['ageing_parent'])
      expect(getAllIds(b)).toContain('carer_support_payment')
    })

    it('free_bus_travel_scotland (young person)', async () => {
      const b = await buildBundle(makePerson({'age':20,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'employed','income_band':'under_25000','housing_tenure':'rent_private','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('free_bus_travel_scotland')
    })

    it('scottish_welfare_fund', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('scottish_welfare_fund')
    })

    it('winter_heating_payment', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('winter_heating_payment')
    })

    it('school_clothing_grant_scotland', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':8}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('school_clothing_grant_scotland')
    })

    it('council_tax_reduction_scotland', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('council_tax_reduction_scotland')
    })

    it('child_disability_payment', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':8,'has_additional_needs':true}]}), ['disability'])
      expect(getAllIds(b)).toContain('child_disability_payment')
    })

    it('ema_scotland', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':17}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('ema_scotland')
    })

  })

  describe('Wales-specific personas', () => {
    it('council_tax_reduction_wales', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'wales','postcode':'CF10 1AA','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('council_tax_reduction_wales')
    })

    it('childcare_offer_wales (working parent)', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'wales','postcode':'CF10 1AA','employment_status':'employed','income_band':'under_25000','housing_tenure':'rent_private','relationship_status':'couple_married','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('childcare_offer_wales')
    })

    it('flying_start_wales', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'wales','postcode':'CF10 1AA','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':2}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('flying_start_wales')
    })

    it('school_essentials_grant_wales', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'wales','postcode':'CF10 1AA','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':8}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('school_essentials_grant_wales')
    })

    it('pupil_development_grant_wales', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'wales','postcode':'CF10 1AA','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':8}]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('pupil_development_grant_wales')
    })

    it('discretionary_assistance_fund_wales', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'wales','postcode':'CF10 1AA','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('discretionary_assistance_fund_wales')
    })

    it('help_to_stay_wales (disabled)', async () => {
      const b = await buildBundle(makePerson({'age':50,'nation':'wales','postcode':'CF10 1AA','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(b)).toContain('help_to_stay_wales')
    })

    it('welsh_government_fuel_support', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'wales','postcode':'CF10 1AA','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).toContain('welsh_government_fuel_support')
    })

  })
})

describe('Group C: Entitlement Exclusion', () => {
  describe('Age-based exclusions', () => {
    it('UC excluded for age >= SPA', async () => {
      const b = await buildBundle(makePerson({'age':67,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('universal_credit')
    })

    it('UC excluded for age < 18', async () => {
      const b = await buildBundle(makePerson({'age':17,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('universal_credit')
    })

    it('PIP excluded for age >= SPA', async () => {
      const b = await buildBundle(makePerson({'age':67,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(b)).not.toContain('pip')
    })

    it('PIP excluded for age < 16', async () => {
      const b = await buildBundle(makePerson({'age':15,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(b)).not.toContain('pip')
    })

    it('pension_credit excluded under SPA', async () => {
      const b = await buildBundle(makePerson({'age':50,'nation':'england','employment_status':'employed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('pension_credit')
    })

    it('winter_fuel_payment excluded under SPA', async () => {
      const b = await buildBundle(makePerson({'age':50,'nation':'england','employment_status':'employed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('winter_fuel_payment')
    })

    it('housing_benefit_legacy excluded under SPA', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('housing_benefit_legacy')
    })

    it('council_tax_support_working_age excluded over SPA', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('council_tax_support_working_age')
    })

    it('ni_voluntary_contributions excluded under 50', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'employed','income_band':'under_50270','housing_tenure':'own_outright','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('ni_voluntary_contributions')
    })

    it('adult_disability_payment excluded over SPA', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'scotland','postcode':'EH1 1YZ','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(b)).not.toContain('adult_disability_payment')
    })

  })

  describe('Income and capital exclusions', () => {
    it('UC excluded when capital >= 16000', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'household_capital':20000}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('universal_credit')
    })

    it('UC excluded for high income', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'employed','income_band':'over_100000','housing_tenure':'own_outright','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('universal_credit')
    })

    it('NHS LIS excluded for very low income', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('nhs_low_income_scheme')
    })

    it('NHS LIS excluded for high capital', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'employed','income_band':'under_16000','housing_tenure':'rent_private','relationship_status':'single','children':[],'household_capital':20000}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('nhs_low_income_scheme')
    })

  })

  describe('Relationship and status exclusions', () => {
    it('marriage_allowance excluded for single', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('marriage_allowance')
    })

    it('CT single person discount excluded for couples', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('council_tax_single_person_discount')
    })

    it('carers_allowance excluded for non-carers', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'single','children':[],'is_carer':false}), ['ageing_parent'])
      expect(getAllIds(b)).not.toContain('carers_allowance')
    })

  })

  describe('Child-related exclusions', () => {
    it('child_benefit excluded without children', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('child_benefit')
    })

    it('FSM excluded without school-age children', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':2}]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('free_school_meals')
    })

    it('healthy_start excluded without young children', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':8}]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('healthy_start')
    })

    it('dla_child excluded without SEN child', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':8}]}), ['disability'])
      expect(getAllIds(b)).not.toContain('dla_child')
    })

    it('TFC excluded without young children', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'england','employment_status':'employed','income_band':'under_50270','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':14}]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('tax_free_childcare')
    })

    it('30hrs childcare excluded for non-working', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('free_childcare_30hrs')
    })

  })

  describe('Housing exclusions', () => {
    it('SMI excluded without mortgage', async () => {
      const b = await buildBundle(makePerson({'age':35,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[],'months_on_uc':12}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('support_mortgage_interest')
    })

    it('HB legacy excluded for homeowners', async () => {
      const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('housing_benefit_legacy')
    })

    it('watersure excluded without water meter', async () => {
      const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'has_disability_or_health_condition':true,'on_water_meter':false}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('watersure')
    })

  })

  describe('Maternity and bereavement exclusions', () => {
    it('maternity_allowance excluded for non-pregnant', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('maternity_allowance')
    })

    it('maternity_exemption_cert excluded for non-pregnant', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[{'age':3}]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('maternity_exemption_cert')
    })

    it('BSP excluded for non-bereaved', async () => {
      const b = await buildBundle(makePerson({'age':50,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'couple_married','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('bereavement_support_payment')
    })

    it('funeral expenses excluded for non-bereaved', async () => {
      const b = await buildBundle(makePerson({'age':50,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('funeral_expenses_payment')
    })

  })

  describe('Consumer rights always excluded', () => {
    it('delay_repay always excluded', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('delay_repay')
    })

    it('flight_compensation always excluded', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('flight_compensation_uk261')
    })

    it('section_75_claim always excluded', async () => {
      const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'employed','income_band':'under_25000','housing_tenure':'mortgage','relationship_status':'single','children':[]}), ['struggling_financially'])
      expect(getAllIds(b)).not.toContain('section_75_claim')
    })

  })
})

describe('Group D: Boundary/Threshold Tests', () => {
  describe('Age boundaries', () => {
    it('UC upper: 65 in, 66 out', async () => {
      const bLow = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':65,'employment_status':'unemployed','income_band':'under_12570'}), ['struggling_financially'])
      const bHigh = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':66,'employment_status':'unemployed','income_band':'under_12570'}), ['struggling_financially'])
      expect(getAllIds(bLow)).toContain('universal_credit')
      expect(getAllIds(bHigh)).not.toContain('universal_credit')
    })

    it('UC lower: 17 out, 18 in', async () => {
      const bLow = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':17,'employment_status':'unemployed','income_band':'under_7400'}), ['struggling_financially'])
      const bHigh = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':18,'employment_status':'unemployed','income_band':'under_7400'}), ['struggling_financially'])
      expect(getAllIds(bLow)).not.toContain('universal_credit')
      expect(getAllIds(bHigh)).toContain('universal_credit')
    })

    it('PIP upper: 65 in, 66 out', async () => {
      const bLow = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':65,'employment_status':'unemployed','income_band':'under_12570','has_disability_or_health_condition':true}), ['disability'])
      const bHigh = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':66,'employment_status':'unemployed','income_band':'under_12570','has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(bLow)).toContain('pip')
      expect(getAllIds(bHigh)).not.toContain('pip')
    })

    it('PIP lower: 15 out, 16 in', async () => {
      const bLow = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':15,'employment_status':'unemployed','income_band':'under_7400','has_disability_or_health_condition':true}), ['disability'])
      const bHigh = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':16,'employment_status':'unemployed','income_band':'under_7400','has_disability_or_health_condition':true}), ['disability'])
      expect(getAllIds(bLow)).not.toContain('pip')
      expect(getAllIds(bHigh)).toContain('pip')
    })

    it('Pension Credit: 65 out, 66 in', async () => {
      const bLow = await buildBundle(makePerson({'nation':'england','housing_tenure':'own_outright','relationship_status':'single','children':[],'age':65,'employment_status':'retired','income_band':'under_12570','gross_annual_income':8000}), ['struggling_financially'])
      const bHigh = await buildBundle(makePerson({'nation':'england','housing_tenure':'own_outright','relationship_status':'single','children':[],'age':66,'employment_status':'retired','income_band':'under_12570','gross_annual_income':8000}), ['struggling_financially'])
      expect(getAllIds(bLow)).not.toContain('pension_credit')
      expect(getAllIds(bHigh)).toContain('pension_credit')
    })

    it('Winter fuel: 65 out, 66 in', async () => {
      const bLow = await buildBundle(makePerson({'nation':'england','housing_tenure':'own_outright','relationship_status':'single','children':[],'age':65,'employment_status':'employed','income_band':'under_25000'}), ['struggling_financially'])
      const bHigh = await buildBundle(makePerson({'nation':'england','housing_tenure':'own_outright','relationship_status':'single','children':[],'age':66,'employment_status':'retired','income_band':'under_25000'}), ['struggling_financially'])
      expect(getAllIds(bLow)).not.toContain('winter_fuel_payment')
      expect(getAllIds(bHigh)).toContain('winter_fuel_payment')
    })

    it('Bus travel England: 65 out, 66 in', async () => {
      const bLow = await buildBundle(makePerson({'nation':'england','housing_tenure':'own_outright','relationship_status':'single','children':[],'age':65,'employment_status':'employed','income_band':'under_25000'}), ['struggling_financially'])
      const bHigh = await buildBundle(makePerson({'nation':'england','housing_tenure':'own_outright','relationship_status':'single','children':[],'age':66,'employment_status':'retired','income_band':'under_25000'}), ['struggling_financially'])
      expect(getAllIds(bLow)).not.toContain('concessionary_bus_travel')
      expect(getAllIds(bHigh)).toContain('concessionary_bus_travel')
    })

    it('NI contributions: 49 out, 50 in', async () => {
      const bLow = await buildBundle(makePerson({'nation':'england','housing_tenure':'own_outright','relationship_status':'single','children':[],'age':49,'employment_status':'employed','income_band':'under_50270'}), ['struggling_financially'])
      const bHigh = await buildBundle(makePerson({'nation':'england','housing_tenure':'own_outright','relationship_status':'single','children':[],'age':50,'employment_status':'employed','income_band':'under_50270'}), ['struggling_financially'])
      expect(getAllIds(bLow)).not.toContain('ni_voluntary_contributions')
      expect(getAllIds(bHigh)).toContain('ni_voluntary_contributions')
    })

  })

  describe('Capital boundaries', () => {
    it('UC capital: 15999 in, 16000 out', async () => {
      const bLow = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':30,'employment_status':'unemployed','income_band':'under_12570','household_capital':15999}), ['struggling_financially'])
      const bHigh = await buildBundle(makePerson({'nation':'england','housing_tenure':'rent_social','relationship_status':'single','children':[],'age':30,'employment_status':'unemployed','income_band':'under_12570','household_capital':16000}), ['struggling_financially'])
      expect(getAllIds(bLow)).toContain('universal_credit')
      expect(getAllIds(bHigh)).not.toContain('universal_credit')
    })

  })

  describe('Carer hours boundary', () => {
    it('non-carer out, 35hrs carer in', async () => {
      const bLow = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'is_carer':false}), ['ageing_parent'])
      const bHigh = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'is_carer':true,'carer_hours_per_week':35,'cared_for_person':{'age':75,'needs_help_daily_living':true}}), ['ageing_parent'])
      expect(getAllIds(bLow)).not.toContain('carers_allowance')
      expect(getAllIds(bHigh)).toContain('carers_allowance')
    })
  })
})

describe('Group E: Conflict Resolution', () => {
  it('UC vs PC: under SPA gets UC not PC', async () => {
    const b = await buildBundle(makePerson({'age':50,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[]}), ['struggling_financially'])
    const ids = getAllIds(b)
    expect(ids).toContain('universal_credit')
    expect(ids).not.toContain('pension_credit')
  })

  it('UC vs PC: over SPA gets PC not UC', async () => {
    const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
    const ids = getAllIds(b)
    expect(ids).toContain('pension_credit')
    expect(ids).not.toContain('universal_credit')
  })

  it('PIP vs AA: under SPA gets PIP', async () => {
    const b = await buildBundle(makePerson({'age':50,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true,'needs_help_with_daily_living':true}), ['disability'])
    const ids = getAllIds(b)
    expect(ids).toContain('pip')
  })

  it('PIP vs AA: over SPA gets AA not PIP', async () => {
    const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'has_disability_or_health_condition':true,'needs_help_with_daily_living':true}), ['disability'])
    const ids = getAllIds(b)
    expect(ids).toContain('attendance_allowance')
    expect(ids).not.toContain('pip')
  })

  it('TFC vs UC conflict is flagged', async () => {
    const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'employed','income_band':'under_16000','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
    const conflicts = b.conflicts
    const tfcUc = conflicts.find((cf: any) => (cf.option_a_id === 'tax_free_childcare' || cf.option_b_id === 'tax_free_childcare') && (cf.option_a_id === 'universal_credit' || cf.option_b_id === 'universal_credit'))
    expect(tfcUc).toBeDefined()
  })
})

describe('Group F: Cascade Integrity', () => {
  it('pension_credit cascades to passported benefits', async () => {
    const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'gross_annual_income':8000}), ['struggling_financially'])
    const gw = b.gateway_entitlements.find((e) => e.id === 'pension_credit')
    expect(gw, 'pension_credit should be gateway').toBeDefined()
    const cascGroup = b.cascaded_entitlements.find((g) => g.gateway_id === 'pension_credit')
    expect(cascGroup, 'pension_credit should have cascaded group').toBeDefined()
    const cIds = cascGroup!.entitlements.map((e) => e.id)
    expect(cIds).toContain('council_tax_reduction_full')
    expect(cIds).toContain('warm_home_discount')
    expect(cIds).toContain('free_nhs_dental')
    expect(cIds).toContain('free_nhs_prescriptions')
    expect(cIds).toContain('social_tariff_broadband')
  })

  it('universal_credit cascades to passported benefits', async () => {
    const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'unemployed','income_band':'under_7400','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':6}]}), ['lost_job','struggling_financially'])
    const gw = b.gateway_entitlements.find((e) => e.id === 'universal_credit')
    expect(gw, 'universal_credit should be gateway').toBeDefined()
    const cascGroup = b.cascaded_entitlements.find((g) => g.gateway_id === 'universal_credit')
    expect(cascGroup, 'universal_credit should have cascaded group').toBeDefined()
    const cIds = cascGroup!.entitlements.map((e) => e.id)
    expect(cIds).toContain('council_tax_support_working_age')
    expect(cIds).toContain('free_school_meals')
    expect(cIds).toContain('social_tariff_broadband')
    expect(cIds).toContain('free_nhs_prescriptions')
    expect(cIds).toContain('free_nhs_dental')
  })

  it('pip cascades to disability benefits', async () => {
    const b = await buildBundle(makePerson({'age':40,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[],'has_disability_or_health_condition':true,'disability_benefit_received':'pip_mobility_enhanced'}), ['disability'])
    const gw = b.gateway_entitlements.find((e) => e.id === 'pip')
    expect(gw, 'pip should be gateway').toBeDefined()
    const cascGroup = b.cascaded_entitlements.find((g) => g.gateway_id === 'pip')
    expect(cascGroup, 'pip should have cascaded group').toBeDefined()
    const cIds = cascGroup!.entitlements.map((e) => e.id)
    expect(cIds).toContain('blue_badge')
    expect(cIds).toContain('vehicle_excise_duty_exemption')
    expect(cIds).toContain('motability_scheme')
  })

  it('carers_allowance cascades to carer benefits', async () => {
    const b = await buildBundle(makePerson({'age':45,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'is_carer':true,'carer_hours_per_week':40,'cared_for_person':{'age':75,'needs_help_daily_living':true}}), ['ageing_parent'])
    // CA may be cascaded under AA, but should still have its own cascade group
    const cascGroup = b.cascaded_entitlements.find((g) => g.gateway_id === 'carers_allowance')
    expect(cascGroup, 'carers_allowance should have cascaded group').toBeDefined()
    const cIds = cascGroup!.entitlements.map((e) => e.id)
    expect(cIds).toContain('carers_credit')
  })

  it('child_benefit is included for parents', async () => {
    const b = await buildBundle(makePerson({'age':30,'nation':'england','employment_status':'unemployed','income_band':'under_12570','housing_tenure':'rent_social','relationship_status':'single','children':[{'age':3}]}), ['struggling_financially'])
    const allIds = [...b.gateway_entitlements.map(e => e.id), ...b.independent_entitlements.map(e => e.id), ...b.cascaded_entitlements.flatMap(g => g.entitlements.map(e => e.id))]
    expect(allIds).toContain('child_benefit')
  })

  it('attendance_allowance cascades to pension_credit', async () => {
    const b = await buildBundle(makePerson({'age':70,'nation':'england','employment_status':'retired','income_band':'under_12570','housing_tenure':'own_outright','relationship_status':'single','children':[],'has_disability_or_health_condition':true,'needs_help_with_daily_living':true,'gross_annual_income':8000}), ['disability'])
    const gw = b.gateway_entitlements.find((e) => e.id === 'attendance_allowance')
    expect(gw, 'attendance_allowance should be gateway').toBeDefined()
    const cascGroup = b.cascaded_entitlements.find((g) => g.gateway_id === 'attendance_allowance')
    expect(cascGroup, 'attendance_allowance should have cascaded group').toBeDefined()
    const cIds = cascGroup!.entitlements.map((e) => e.id)
    expect(cIds).toContain('pension_credit')
  })
})

// --- Group: Deprivation-aware eligibility ---

function getConfidence(bundle: Awaited<ReturnType<typeof buildBundle>>, id: string): string | undefined {
  const all = [
    ...bundle.gateway_entitlements,
    ...bundle.independent_entitlements,
    ...bundle.cascaded_entitlements.flatMap((g) => g.entitlements),
  ]
  return all.find((e) => e.id === id)?.confidence
}

describe('Group: Deprivation-aware eligibility', () => {
  // DEP-01: Low income + deprived area → eco_home_insulation likely
  it('DEP-01: eco_home_insulation likely in deprived area with low income', async () => {
    const b = await buildBundle(makePerson({age:35,nation:'england',employment_status:'unemployed',income_band:'under_12570',housing_tenure:'rent_social',relationship_status:'single',children:[],deprivation_decile:2}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('eco_home_insulation')
    expect(getConfidence(b, 'eco_home_insulation')).toBe('likely')
  })

  // DEP-02: Low income + affluent area → eco_home_insulation possible
  it('DEP-02: eco_home_insulation possible in affluent area with low income', async () => {
    const b = await buildBundle(makePerson({age:35,nation:'england',employment_status:'unemployed',income_band:'under_12570',housing_tenure:'rent_social',relationship_status:'single',children:[],deprivation_decile:8}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('eco_home_insulation')
    expect(getConfidence(b, 'eco_home_insulation')).toBe('possible')
  })

  // DEP-03: Medium income + deprived area → eco_home_insulation possible
  it('DEP-03: eco_home_insulation possible with medium income in deprived area', async () => {
    const b = await buildBundle(makePerson({age:35,nation:'england',employment_status:'employed',income_band:'under_25000',housing_tenure:'rent_private',relationship_status:'single',children:[],gross_annual_income:20000,deprivation_decile:2}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('eco_home_insulation')
    expect(getConfidence(b, 'eco_home_insulation')).toBe('possible')
  })

  // DEP-04: Medium income + affluent area → eco_home_insulation worth_checking
  it('DEP-04: eco_home_insulation worth_checking with medium income in affluent area', async () => {
    const b = await buildBundle(makePerson({age:35,nation:'england',employment_status:'employed',income_band:'under_25000',housing_tenure:'rent_private',relationship_status:'single',children:[],gross_annual_income:20000,deprivation_decile:8}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('eco_home_insulation')
    expect(getConfidence(b, 'eco_home_insulation')).toBe('worth_checking')
  })

  // DEP-05: Low income + deprived area → warm_home_discount likely
  it('DEP-05: warm_home_discount likely in deprived area', async () => {
    const b = await buildBundle(makePerson({age:35,nation:'england',employment_status:'unemployed',income_band:'under_12570',housing_tenure:'rent_social',relationship_status:'single',children:[],deprivation_decile:2}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('warm_home_discount')
    expect(getConfidence(b, 'warm_home_discount')).toBe('likely')
  })

  // DEP-06: Low income + non-deprived area → warm_home_discount possible
  it('DEP-06: warm_home_discount possible in non-deprived area', async () => {
    const b = await buildBundle(makePerson({age:35,nation:'england',employment_status:'unemployed',income_band:'under_12570',housing_tenure:'rent_social',relationship_status:'single',children:[],deprivation_decile:7}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('warm_home_discount')
    expect(getConfidence(b, 'warm_home_discount')).toBe('possible')
  })

  // DEP-07: Parent of 2yo in deprived Welsh area → flying_start_wales possible
  it('DEP-07: flying_start_wales possible in deprived Welsh area', async () => {
    const b = await buildBundle(makePerson({age:30,nation:'wales',postcode:'CF10 1AA',employment_status:'unemployed',income_band:'under_12570',housing_tenure:'rent_social',relationship_status:'single',children:[{age:2}],deprivation_decile:1}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('flying_start_wales')
    expect(getConfidence(b, 'flying_start_wales')).toBe('possible')
  })

  // DEP-08: Parent of 2yo in affluent Welsh area → flying_start_wales worth_checking
  it('DEP-08: flying_start_wales worth_checking in affluent Welsh area', async () => {
    const b = await buildBundle(makePerson({age:30,nation:'wales',postcode:'CF10 1AA',employment_status:'employed',income_band:'under_25000',housing_tenure:'own_outright',relationship_status:'couple_married',children:[{age:2}],deprivation_decile:9}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('flying_start_wales')
    expect(getConfidence(b, 'flying_start_wales')).toBe('worth_checking')
  })

  // DEP-09: Parent of 2yo, no deprivation data (partial postcode) → flying_start_wales worth_checking (no regression)
  it('DEP-09: flying_start_wales worth_checking without deprivation data', async () => {
    const b = await buildBundle(makePerson({age:30,nation:'wales',postcode:'CF10',employment_status:'unemployed',income_band:'under_12570',housing_tenure:'rent_social',relationship_status:'single',children:[{age:2}],postcode_partial:true}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('flying_start_wales')
    expect(getConfidence(b, 'flying_start_wales')).toBe('worth_checking')
  })

  // DEP-10: Parent of 2yo in deprived England area, higher income → free_childcare_15hrs_disadvantaged eligible
  it('DEP-10: free_childcare_15hrs_disadvantaged eligible in deprived area', async () => {
    const b = await buildBundle(makePerson({age:30,nation:'england',employment_status:'employed',income_band:'under_25000',housing_tenure:'rent_private',relationship_status:'single',children:[{age:2}],gross_annual_income:20000,deprivation_decile:2}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('free_childcare_15hrs_disadvantaged')
  })

  // DEP-11: Parent of 2yo in affluent area, high income → free_childcare_15hrs_disadvantaged not eligible
  it('DEP-11: free_childcare_15hrs_disadvantaged not eligible in affluent area with high income', async () => {
    const b = await buildBundle(makePerson({age:30,nation:'england',employment_status:'employed',income_band:'under_50270',housing_tenure:'own_mortgage',relationship_status:'couple_married',children:[{age:2}],gross_annual_income:45000,deprivation_decile:9}), ['struggling_financially'])
    expect(getAllIds(b)).not.toContain('free_childcare_15hrs_disadvantaged')
  })

  // DEP-12: No deprivation data → eco_home_insulation confidence unchanged (no regression)
  it('DEP-12: eco_home_insulation possible without deprivation data (no regression)', async () => {
    const b = await buildBundle(makePerson({age:35,nation:'england',employment_status:'unemployed',income_band:'under_12570',housing_tenure:'rent_social',relationship_status:'single',children:[]}), ['struggling_financially'])
    expect(getAllIds(b)).toContain('eco_home_insulation')
    expect(getConfidence(b, 'eco_home_insulation')).toBe('possible')
  })
})
