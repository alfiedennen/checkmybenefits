import { useState } from 'react'

interface Props {
  onAuthenticated: () => void
}

const CORRECT_PASSWORD = 'triage2026'

export function CaseStudyPasswordGate({ onAuthenticated }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem('case-study-auth', 'true')
      onAuthenticated()
    } else {
      setError(true)
    }
  }

  return (
    <div className="cs-password-gate">
      <form onSubmit={handleSubmit}>
        <h2>This page is for a presentation</h2>
        <p>Enter the password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false) }}
          autoFocus
          aria-label="Password"
        />
        {error && <p className="cs-password-error">Incorrect password</p>}
        <button type="submit">Continue</button>
      </form>
    </div>
  )
}
