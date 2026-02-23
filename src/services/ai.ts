import type { Message, QuickReply, ConversationStage, SituationId } from '../types/conversation.ts'
import type { PersonData } from '../types/person.ts'
import { buildSystemPrompt } from './system-prompt.ts'

export interface AIResponse {
  text: string
  personData?: Partial<PersonData>
  quickReplies?: QuickReply[]
  situations?: SituationId[]
  stageTransition?: ConversationStage
}

export async function sendMessage(
  messages: Message[],
  stage: ConversationStage,
  personData: PersonData,
  situations: SituationId[],
): Promise<AIResponse> {
  const system = buildSystemPrompt(stage, personData, situations)

  const apiMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }))

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages, system }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  const rawText = data.content?.[0]?.text ?? ''

  return parseAIResponse(rawText)
}

export function parseAIResponse(raw: string): AIResponse {
  let text = raw

  // Extract ALL <person_data> blocks and merge them
  let personData: Partial<PersonData> | undefined
  const personDataMatches = [...text.matchAll(/<person_data>([\s\S]*?)<\/person_data>/g)]
  for (const match of personDataMatches) {
    try {
      const parsed = JSON.parse(match[1])
      personData = personData ? { ...personData, ...parsed } : parsed
    } catch {
      // Ignore malformed JSON
    }
  }
  text = text.replace(/<person_data>[\s\S]*?<\/person_data>/g, '')

  // Extract <quick_replies> JSON array
  let quickReplies: QuickReply[] | undefined
  const qrMatch = text.match(/<quick_replies>([\s\S]*?)<\/quick_replies>/)
  if (qrMatch) {
    try {
      quickReplies = JSON.parse(qrMatch[1])
    } catch {
      // Ignore malformed JSON
    }
    text = text.replace(/<quick_replies>[\s\S]*?<\/quick_replies>/g, '')
  }

  // Extract ALL <situation> tags — support comma-separated and multiple tags
  const situations: SituationId[] = []
  const sitMatches = [...text.matchAll(/<situation>([\s\S]*?)<\/situation>/g)]
  for (const match of sitMatches) {
    const value = match[1].trim()
    // Support comma-separated: <situation>ageing_parent, lost_job</situation>
    const ids = value.split(/[,\s]+/).filter(Boolean) as SituationId[]
    situations.push(...ids)
  }
  text = text.replace(/<situation>[\s\S]*?<\/situation>/g, '')

  // Extract <stage_transition>
  let stageTransition: ConversationStage | undefined
  const stageMatch = text.match(/<stage_transition>([\s\S]*?)<\/stage_transition>/)
  if (stageMatch) {
    stageTransition = stageMatch[1].trim() as ConversationStage
    text = text.replace(/<stage_transition>[\s\S]*?<\/stage_transition>/g, '')
  }

  // Clean up the text — remove any remaining XML-like tags and trim whitespace
  text = text.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '').trim()

  return {
    text,
    personData,
    quickReplies,
    situations: situations.length > 0 ? situations : undefined,
    stageTransition,
  }
}
