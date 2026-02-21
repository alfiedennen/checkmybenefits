import type { QuickReply } from '../types/conversation.ts'

export const QUICK_REPLIES: Record<string, QuickReply[]> = {
  household: [
    { label: 'Just me', value: 'single' },
    { label: 'Me and a partner', value: 'couple' },
    { label: 'Me, partner, and children', value: 'family' },
    { label: 'Me and children (no partner)', value: 'lone_parent' },
    { label: 'Something else', value: 'other' },
  ],
  housing: [
    { label: 'Renting (private landlord)', value: 'rent_private' },
    { label: 'Renting (council/housing association)', value: 'rent_social' },
    { label: 'Own with a mortgage', value: 'mortgage' },
    { label: 'Own outright', value: 'own_outright' },
    { label: 'Living with family', value: 'living_with_family' },
  ],
  income_band: [
    { label: 'Under £12,500', value: 'under_12570' },
    { label: '£12,500 – £25,000', value: 'under_25000' },
    { label: '£25,000 – £50,000', value: 'under_50270' },
    { label: '£50,000 – £100,000', value: 'under_100000' },
    { label: 'Over £100,000', value: 'over_100000' },
    { label: "I'd rather not say", value: 'prefer_not_to_say' },
  ],
  yes_no: [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ],
  already_claiming_uc: [
    { label: 'Yes, already applied', value: 'already_claiming' },
    { label: 'No, not yet', value: 'not_yet' },
    { label: "I'm not sure", value: 'unsure' },
  ],
  caring_hours: [
    { label: 'Less than 20 hours', value: 'under_20' },
    { label: '20–35 hours', value: '20_to_35' },
    { label: '35+ hours', value: 'over_35' },
    { label: "I'm not sure", value: 'unsure' },
  ],
  parent_age: [
    { label: 'Under 66', value: 'under_66' },
    { label: '66–74', value: '66_to_74' },
    { label: '75–84', value: '75_to_84' },
    { label: '85+', value: '85_plus' },
  ],
  child_age: [
    { label: 'Under 3', value: 'under_3' },
    { label: '3–4', value: '3_to_4' },
    { label: '5–10', value: '5_to_10' },
    { label: '11–15', value: '11_to_15' },
    { label: '16–17', value: '16_to_17' },
  ],
  employment: [
    { label: 'Employed', value: 'employed' },
    { label: 'Self-employed', value: 'self_employed' },
    { label: 'Not working', value: 'unemployed' },
    { label: 'Retired', value: 'retired' },
    { label: 'Full-time carer', value: 'carer_fulltime' },
  ],
}
