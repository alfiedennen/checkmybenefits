import type { PersonData, IncomeBand, HousingTenure } from './person.ts'
import type { EntitlementBundle } from './entitlements.ts'

export type SituationId =
  | 'ageing_parent'
  | 'new_baby'
  | 'child_struggling_school'
  | 'lost_job'
  | 'separation'
  | 'bereavement'
  | 'retirement_low_income'
  | 'health_condition'
  | 'consumer_dispute'

export type ConversationStage =
  | 'intake'
  | 'classifying'
  | 'questions'
  | 'preliminary'
  | 'refining'
  | 'complete'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  quickReplies?: QuickReply[]
}

export interface QuickReply {
  label: string
  value: string | boolean | Record<string, unknown>
}

export interface ConversationAnswers {
  household_composition?: { type: string; children_ages?: number[] }
  postcode?: string
  local_authority?: string
  income_band?: IncomeBand
  housing_tenure?: HousingTenure
  [key: string]: unknown
}

export interface ConversationState {
  stage: ConversationStage
  situations: SituationId[]
  personData: PersonData
  answers: ConversationAnswers
  bundle: EntitlementBundle | null
  messages: Message[]
  isLoading: boolean
  error: string | null
}

export type ConversationAction =
  | { type: 'ADD_USER_MESSAGE'; content: string }
  | { type: 'ADD_ASSISTANT_MESSAGE'; content: string; quickReplies?: QuickReply[] }
  | { type: 'SET_STAGE'; stage: ConversationStage }
  | { type: 'SET_SITUATIONS'; situations: SituationId[] }
  | { type: 'UPDATE_PERSON_DATA'; data: Partial<PersonData> }
  | { type: 'UPDATE_ANSWERS'; answers: Partial<ConversationAnswers> }
  | { type: 'SET_BUNDLE'; bundle: EntitlementBundle }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
