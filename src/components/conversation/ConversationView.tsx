import { useEffect, useRef } from 'react'
import type { Message, QuickReply } from '../../types/conversation.ts'
import { MessageBubble } from './MessageBubble.tsx'
import { QuickReplyButtons } from './QuickReplyButtons.tsx'
import { TextInput } from './TextInput.tsx'
import { TypingIndicator } from './TypingIndicator.tsx'

interface Props {
  messages: Message[]
  isLoading: boolean
  onSendMessage: (text: string) => void
  onQuickReply: (reply: QuickReply) => void
}

export function ConversationView({ messages, isLoading, onSendMessage, onQuickReply }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Get quick replies from the last assistant message
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')
  const quickReplies = lastAssistantMessage?.quickReplies

  return (
    <div className="conversation-view">
      <div className="conversation-messages" role="log" aria-label="Conversation" aria-live="polite">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {quickReplies && quickReplies.length > 0 && !isLoading && (
        <QuickReplyButtons replies={quickReplies} onSelect={onQuickReply} disabled={isLoading} />
      )}

      <TextInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  )
}
