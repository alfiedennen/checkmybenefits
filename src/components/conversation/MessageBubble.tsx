import type { Message } from '../../types/conversation.ts'

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`message-bubble ${isUser ? 'message-user' : 'message-assistant'}`}
      role="article"
      aria-label={`${isUser ? 'You' : 'CitizenFirst'} said`}
    >
      <div className="message-content">{message.content}</div>
    </div>
  )
}
