import type { QuickReply } from '../../types/conversation.ts'

interface Props {
  replies: QuickReply[]
  onSelect: (reply: QuickReply) => void
  disabled?: boolean
}

export function QuickReplyButtons({ replies, onSelect, disabled = false }: Props) {
  return (
    <div className="quick-replies" role="group" aria-label="Suggested responses">
      {replies.map((reply, i) => (
        <button
          key={i}
          className="quick-reply-btn"
          onClick={() => onSelect(reply)}
          disabled={disabled}
        >
          {reply.label}
        </button>
      ))}
    </div>
  )
}
