import { useState } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export function TextInput({ onSend, disabled = false, placeholder = 'Type your message...' }: Props) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form className="text-input-form" onSubmit={handleSubmit}>
      <textarea
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        aria-label="Your message"
      />
      <button
        type="submit"
        className="text-input-send"
        disabled={disabled || !text.trim()}
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  )
}
