import { useReducer, useCallback, useRef } from 'react'
import type { QuickReply } from '../types/conversation.ts'
import { conversationReducer, createInitialState } from '../engine/state-machine.ts'
import { buildBundle } from '../engine/bundle-builder.ts'
import { sendMessage } from '../services/claude.ts'
import { lookupPostcode, countryToNation } from '../services/postcodes.ts'

const OPENING_MESSAGE = `Tell me what's going on — in your own words. Or if one of these fits, tap it to get started.`

const SITUATION_QUICK_REPLIES: QuickReply[] = [
  { label: "My parent is struggling to cope", value: "My mum can't cope on her own anymore" },
  { label: "We're expecting a baby", value: "We're expecting a baby" },
  { label: "My child is struggling at school", value: "My child is struggling at school" },
  { label: "I've lost my job", value: "I've just lost my job" },
]

const FALLBACK_MESSAGE = `I'm sorry, I'm having trouble connecting right now. In the meantime, you can contact Citizens Advice on 0800 144 8848 or visit citizensadvice.org.uk for help with benefits and entitlements.`

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

        const response = await sendMessage(
          allMessages,
          current.stage,
          current.personData,
          current.situations,
        )

        // Apply person data updates
        if (response.personData) {
          dispatch({ type: 'UPDATE_PERSON_DATA', data: response.personData })

          // If postcode was provided, do a lookup for nation/local authority
          if (response.personData.postcode) {
            const postcodeResult = await lookupPostcode(response.personData.postcode)
            if (postcodeResult) {
              dispatch({
                type: 'UPDATE_PERSON_DATA',
                data: {
                  nation: countryToNation(postcodeResult.country),
                  local_authority: postcodeResult.admin_district,
                },
              })
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
          dispatch({ type: 'SET_STAGE', stage: response.stageTransition })

          // If transitioning to complete, build the bundle
          if (response.stageTransition === 'complete') {
            const updatedPerson = {
              ...stateRef.current.personData,
              ...(response.personData ?? {}),
            }
            const allSituations = [
              ...stateRef.current.situations,
              ...(response.situations ?? []),
            ]
            const uniqueSituations = [...new Set(allSituations)]

            const bundle = buildBundle(updatedPerson, uniqueSituations)
            dispatch({ type: 'SET_BUNDLE', bundle })
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
