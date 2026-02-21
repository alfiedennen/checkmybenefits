import type { ConversationState, ConversationAction } from '../types/conversation.ts'
import { createEmptyPerson } from '../types/person.ts'

export function createInitialState(): ConversationState {
  return {
    stage: 'intake',
    situations: [],
    personData: createEmptyPerson(),
    answers: {},
    bundle: null,
    messages: [],
    isLoading: false,
    error: null,
  }
}

let messageCounter = 0

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: `msg-${++messageCounter}`,
            role: 'user',
            content: action.content,
            timestamp: Date.now(),
          },
        ],
      }

    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: `msg-${++messageCounter}`,
            role: 'assistant',
            content: action.content,
            timestamp: Date.now(),
            quickReplies: action.quickReplies,
          },
        ],
      }

    case 'SET_STAGE':
      return { ...state, stage: action.stage }

    case 'SET_SITUATIONS':
      return { ...state, situations: action.situations }

    case 'UPDATE_PERSON_DATA':
      return {
        ...state,
        personData: { ...state.personData, ...action.data },
      }

    case 'UPDATE_ANSWERS':
      return {
        ...state,
        answers: { ...state.answers, ...action.answers },
      }

    case 'SET_BUNDLE':
      return { ...state, bundle: action.bundle }

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    default:
      return state
  }
}
