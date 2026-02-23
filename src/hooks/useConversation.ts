import { useReducer, useCallback, useRef } from 'react'
import type { QuickReply } from '../types/conversation.ts'
import { conversationReducer, createInitialState } from '../engine/state-machine.ts'
import type { PersonData } from '../types/person.ts'
import { buildBundle } from '../engine/bundle-builder.ts'
import { sendMessage } from '../services/ai.ts'
import { extractFromMessage, mergeExtraction } from '../services/message-extractor.ts'
import { lookupPostcode, countryToNation } from '../services/postcodes.ts'
import { getDeprivationDecile } from '../services/deprivation.ts'

/**
 * Check that we have the minimum fields needed to produce useful results.
 * Only gates on fields that heavily affect eligibility outcomes.
 * Age and relationship_status have sensible defaults in eligibility rules.
 */
function hasCriticalFields(person: PersonData): boolean {
  return !!(
    person.employment_status &&
    person.income_band &&
    person.housing_tenure &&
    person.postcode
  )
}

const OPENING_MESSAGE = `What's going on in your life right now? Tell me in your own words, or pick one of these to get started.`

const SITUATION_QUICK_REPLIES: QuickReply[] = [
  { label: "My parent is struggling to cope", value: "My mum can't cope on her own anymore" },
  { label: "We're expecting a baby", value: "We're expecting a baby" },
  { label: "My child is struggling at school", value: "My child is struggling at school" },
  { label: "I've lost my job", value: "I've just lost my job" },
  { label: "I have a health condition", value: "I have a health condition that affects my daily life" },
  { label: "Something else", value: "I need help but my situation doesn't fit these categories" },
]

const FALLBACK_MESSAGE = `I'm sorry, I'm having trouble connecting right now. In the meantime, you can contact Citizens Advice on 0800 144 8848 or visit citizensadvice.org.uk for help with benefits and entitlements.`

const OFFLINE_MESSAGE = `You appear to be offline. Please check your internet connection and try again. If you need immediate help, you can call Citizens Advice on 0800 144 8848.`

const BUNDLE_ERROR_MESSAGE = `We couldn't generate your results right now. You can still contact Citizens Advice on 0800 144 8848 or visit citizensadvice.org.uk for a benefits check.`

const API_TIMEOUT_MS = 15_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms)
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useConversation() {
  const [state, dispatch] = useReducer(conversationReducer, undefined, () => {
    const initial = createInitialState()
    return {
      ...initial,
      messages: [
        {
          id: 'msg-0',
          role: 'assistant' as const,
          content: OPENING_MESSAGE,
          timestamp: Date.now(),
          quickReplies: SITUATION_QUICK_REPLIES,
        },
      ],
    }
  })

  // Use ref to always read latest state inside async callbacks
  const stateRef = useRef(state)
  stateRef.current = state

  const handleSendMessage = useCallback(
    async (text: string) => {
      dispatch({ type: 'ADD_USER_MESSAGE', content: text })
      dispatch({ type: 'SET_LOADING', isLoading: true })

      // Offline check
      if (!navigator.onLine) {
        dispatch({ type: 'ADD_ASSISTANT_MESSAGE', content: OFFLINE_MESSAGE })
        dispatch({ type: 'SET_LOADING', isLoading: false })
        return
      }

      try {
        const current = stateRef.current
        // Build messages list including the new user message
        const allMessages = [
          ...current.messages,
          {
            id: 'pending',
            role: 'user' as const,
            content: text,
            timestamp: Date.now(),
          },
        ]

        // Send with timeout + 1 retry
        let response
        try {
          response = await withTimeout(
            sendMessage(allMessages, current.stage, current.personData, current.situations),
            API_TIMEOUT_MS,
          )
        } catch {
          // Retry once after a short delay
          await delay(2000)
          response = await withTimeout(
            sendMessage(allMessages, current.stage, current.personData, current.situations),
            API_TIMEOUT_MS,
          )
        }

        // Apply person data updates — merge model extraction with code-based fallback
        const codeExtracted = extractFromMessage(text)
        const mergedPersonData = mergeExtraction(response.personData, codeExtracted)
        const hasPersonData = mergedPersonData && Object.keys(mergedPersonData).length > 0

        if (hasPersonData) {
          dispatch({ type: 'UPDATE_PERSON_DATA', data: mergedPersonData })

          // If postcode was provided, do a lookup for nation/local authority
          if (mergedPersonData.postcode) {
            try {
              const postcodeResult = await lookupPostcode(mergedPersonData.postcode!)
              if (postcodeResult) {
                const deprivationDecile = postcodeResult.lsoa
                  ? getDeprivationDecile(postcodeResult.lsoa)
                  : null
                dispatch({
                  type: 'UPDATE_PERSON_DATA',
                  data: {
                    nation: countryToNation(postcodeResult.country),
                    local_authority: postcodeResult.admin_district,
                    lsoa: postcodeResult.lsoa || undefined,
                    deprivation_decile: deprivationDecile ?? undefined,
                  },
                })
              } else {
                // Default to england if lookup fails
                dispatch({ type: 'UPDATE_PERSON_DATA', data: { nation: 'england' } })
              }
            } catch {
              // Default to england if lookup fails
              dispatch({ type: 'UPDATE_PERSON_DATA', data: { nation: 'england' } })
            }
          }
        }

        // Apply situation classifications (now supports multiple)
        if (response.situations && response.situations.length > 0) {
          const currentSituations = stateRef.current.situations
          const merged = [...new Set([...currentSituations, ...response.situations])]
          dispatch({ type: 'SET_SITUATIONS', situations: merged })
        }

        // Apply stage transition
        if (response.stageTransition) {
          // Gate: don't allow complete transition if critical fields are missing
          const personSoFar = { ...stateRef.current.personData, ...(mergedPersonData ?? {}) }
          const allowTransition =
            response.stageTransition !== 'complete' || hasCriticalFields(personSoFar)

          if (allowTransition) {
            dispatch({ type: 'SET_STAGE', stage: response.stageTransition })
          }

          // If transitioning to complete, build the bundle
          if (response.stageTransition === 'complete' && allowTransition) {
            const updatedPerson = {
              ...stateRef.current.personData,
              ...(mergedPersonData ?? {}),
            }
            const allSituations = [
              ...stateRef.current.situations,
              ...(response.situations ?? []),
            ]
            const uniqueSituations = [...new Set(allSituations)]

            try {
              const bundle = await buildBundle(updatedPerson, uniqueSituations)
              dispatch({ type: 'SET_BUNDLE', bundle })
            } catch (err) {
              console.error('Bundle build error:', err)
              dispatch({ type: 'ADD_ASSISTANT_MESSAGE', content: BUNDLE_ERROR_MESSAGE })
            }
          }
        }

        // Add the assistant message
        dispatch({
          type: 'ADD_ASSISTANT_MESSAGE',
          content: response.text,
          quickReplies: response.quickReplies,
        })
      } catch (error) {
        console.error('Conversation error:', error)
        dispatch({
          type: 'ADD_ASSISTANT_MESSAGE',
          content: FALLBACK_MESSAGE,
        })
        dispatch({ type: 'SET_ERROR', error: 'Failed to get response' })
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false })
      }
    },
    [],
  )

  const handleQuickReply = useCallback(
    (reply: QuickReply) => {
      handleSendMessage(reply.label)
    },
    [handleSendMessage],
  )

  return {
    state,
    handleSendMessage,
    handleQuickReply,
  }
}
