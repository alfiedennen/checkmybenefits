import { useState } from 'react'

export function PrivacyBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="privacy-banner" role="status">
      <p>
        We don't store your information. This conversation exists only in your browser.
        No data is saved when you close this page.
      </p>
      <button
        className="privacy-banner-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss privacy notice"
      >
        Got it
      </button>
    </div>
  )
}
