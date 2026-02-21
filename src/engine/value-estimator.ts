import type { PersonData } from '../types/person.ts'
import type { EntitlementDefinition } from '../types/entitlements.ts'
import type { PolicyEngineCalculatedBenefits } from '../types/policyengine.ts'
import benefitRates from '../data/benefit-rates.json'

const rates = benefitRates.rates

interface ValueRange {
  low: number
  high: number
}

const PE_BENEFIT_MAP: Record<string, keyof PolicyEngineCalculatedBenefits> = {
  universal_credit: 'universal_credit',
  pension_credit: 'pension_credit',
  child_benefit: 'child_benefit',
  housing_benefit_legacy: 'housing_benefit',
  council_tax_reduction_full: 'council_tax_support',
  council_tax_support_working_age: 'council_tax_support',
}

/**
 * Calculate estimated annual value ranges for an entitlement
 * based on person data and benefit rates. Uses PolicyEngine values when available.
 */
export function estimateValue(
  entitlement: EntitlementDefinition,
  personData: PersonData,
  peResults?: PolicyEngineCalculatedBenefits | null,
): ValueRange {
  // Try PolicyEngine precise value first
  if (peResults) {
    const peKey = PE_BENEFIT_MAP[entitlement.id]
    if (peKey) {
      const peValue = peResults[peKey]
      if (typeof peValue === 'number' && peValue > 0) {
        return { low: peValue, high: peValue }
      }
    }
  }

  // Try specific heuristic calculation
  const specific = specificEstimate(entitlement.id, personData)
  if (specific) return specific

  // Fall back to the range from the data model
  if (entitlement.estimated_annual_value_range) {
    return {
      low: entitlement.estimated_annual_value_range[0],
      high: entitlement.estimated_annual_value_range[1],
    }
  }

  return { low: 0, high: 0 }
}

function specificEstimate(id: string, personData: PersonData): ValueRange | null {
  switch (id) {
    case 'attendance_allowance':
      return {
        low: rates.attendance_allowance.lower_weekly * 52,
        high: rates.attendance_allowance.higher_weekly * 52,
      }

    case 'pension_credit': {
      const threshold = isCoupleish(personData)
        ? rates.pension_credit.couple_weekly
        : rates.pension_credit.single_weekly
      // Rough estimate: difference between current income and threshold
      const weeklyIncome = (personData.gross_annual_income ?? 0) / 52
      const gap = Math.max(0, threshold - weeklyIncome)
      return {
        low: Math.round(gap * 0.5 * 52), // Conservative
        high: Math.round(gap * 52),
      }
    }

    case 'carers_allowance':
      return {
        low: rates.carers_allowance.weekly * 52,
        high: rates.carers_allowance.weekly * 52,
      }

    case 'child_benefit': {
      const numChildren = personData.children.length
      if (numChildren === 0) return null
      const annual =
        rates.child_benefit.first_child_weekly * 52 +
        Math.max(0, numChildren - 1) * rates.child_benefit.additional_child_weekly * 52
      return { low: Math.round(annual), high: Math.round(annual) }
    }

    case 'universal_credit': {
      // Very rough estimate based on standard allowance only
      const age = personData.age ?? 30
      const couple = isCoupleish(personData)
      let monthly: number
      if (couple) {
        monthly =
          age >= 25
            ? rates.universal_credit.standard_allowance_couple_25_plus_monthly
            : rates.universal_credit.standard_allowance_couple_under_25_monthly
      } else {
        monthly =
          age >= 25
            ? rates.universal_credit.standard_allowance_single_25_plus_monthly
            : rates.universal_credit.standard_allowance_single_under_25_monthly
      }
      // Add child elements
      const numChildren = personData.children.length
      if (numChildren >= 1) monthly += rates.universal_credit.child_element_first_monthly
      if (numChildren >= 2)
        monthly += (numChildren - 1) * rates.universal_credit.child_element_subsequent_monthly
      // Add carer element
      if (personData.is_carer && (personData.carer_hours_per_week ?? 0) >= 35)
        monthly += rates.universal_credit.carer_element_monthly

      return {
        low: Math.round(monthly * 6), // Partial year / tapered
        high: Math.round(monthly * 12),
      }
    }

    case 'marriage_allowance':
      return {
        low: rates.marriage_allowance.annual_value,
        high: rates.marriage_allowance.annual_value + rates.marriage_allowance.max_backdate_value,
      }

    case 'warm_home_discount':
      return {
        low: rates.warm_home_discount.amount,
        high: rates.warm_home_discount.amount,
      }

    case 'pip':
      return {
        low: rates.pip.daily_living_standard_weekly * 52,
        high: (rates.pip.daily_living_enhanced_weekly + rates.pip.mobility_enhanced_weekly) * 52,
      }

    case 'healthy_start':
      return {
        low: rates.healthy_start.weekly * 52,
        high: rates.healthy_start.weekly * 52,
      }

    case 'free_school_meals':
      return {
        low: rates.free_school_meals.estimated_annual_value,
        high: rates.free_school_meals.estimated_annual_value * personData.children.length,
      }

    case 'free_nhs_prescriptions':
      // Average person gets ~12 prescriptions/year, £9.90 each
      return {
        low: rates.nhs_prescription_charge * 4,
        high: rates.nhs_prescription_charge * 12,
      }

    case 'free_nhs_dental':
      // Band 1 to Band 3
      return {
        low: rates.nhs_dental_band_1,
        high: rates.nhs_dental_band_3,
      }

    case 'free_nhs_sight_tests':
      return {
        low: rates.nhs_sight_test_cost,
        high: rates.nhs_sight_test_cost * 2,
      }

    case 'nhs_optical_vouchers':
      return { low: 39, high: 215 }

    case 'nhs_low_income_scheme':
      // Aggregate value of all NHS costs it covers
      return { low: 100, high: 500 }

    case 'nhs_travel_costs':
      return { low: 50, high: 500 }

    case 'maternity_exemption_cert':
      // Prescriptions + dental during pregnancy
      return {
        low: rates.nhs_prescription_charge * 4,
        high: rates.nhs_prescription_charge * 12 + rates.nhs_dental_band_2,
      }

    case 'prescription_prepayment_cert':
      // Saving vs pay-per-item: PPC costs £111.60/yr, saves if >12 items
      return {
        low: 0,
        high: Math.round(rates.nhs_prescription_charge * 24 - rates.nhs_ppc_12_month),
      }

    case 'free_childcare_15hrs_universal':
    case 'free_childcare_15hrs_disadvantaged':
      // 15hrs × 38 weeks × hourly rate
      return {
        low: Math.round(15 * 38 * rates.free_childcare_hourly_rate * 0.7),
        high: Math.round(15 * 38 * rates.free_childcare_hourly_rate),
      }

    case 'free_childcare_30hrs':
      // 30hrs × 38 weeks × hourly rate
      return {
        low: Math.round(30 * 38 * rates.free_childcare_hourly_rate * 0.7),
        high: Math.round(30 * 38 * rates.free_childcare_hourly_rate),
      }

    case 'sure_start_maternity_grant':
      return {
        low: rates.sure_start_maternity_grant,
        high: rates.sure_start_maternity_grant,
      }

    case 'childcare_grant_students':
      return {
        low: Math.round(rates.childcare_grant_max_weekly_1_child * 0.3 * 40),
        high: Math.round(rates.childcare_grant_max_weekly_2_plus * 40),
      }

    case '16_19_bursary':
      return {
        low: 100,
        high: rates['16_19_bursary_vulnerable'],
      }

    case 'student_maintenance_loan':
      return { low: 4000, high: 14000 }

    case 'winter_fuel_payment':
      return {
        low: rates.winter_fuel_payment_under_80,
        high: rates.winter_fuel_payment_80_plus,
      }

    case 'cold_weather_payment':
      return {
        low: rates.cold_weather_payment_per_period,
        high: rates.cold_weather_payment_per_period * 6,
      }

    case 'housing_benefit_legacy': {
      const rent = personData.monthly_housing_cost ?? 500
      return {
        low: Math.round(rent * 6),
        high: Math.round(rent * 12),
      }
    }

    case 'motability_scheme':
      return { low: 3000, high: 5000 }

    case 'vehicle_excise_duty_exemption':
      return { low: 165, high: 190 }

    case 'concessionary_bus_travel':
      return { low: 200, high: 500 }

    case 'support_mortgage_interest': {
      // Rough estimate: covers interest portion of mortgage
      const mortgage = personData.monthly_housing_cost ?? 800
      return {
        low: Math.round(mortgage * 0.3 * 12),
        high: Math.round(mortgage * 0.6 * 12),
      }
    }

    default:
      return null
  }
}

function isCoupleish(personData: PersonData): boolean {
  return (
    personData.relationship_status === 'couple_married' ||
    personData.relationship_status === 'couple_civil_partner' ||
    personData.relationship_status === 'couple_cohabiting'
  )
}
