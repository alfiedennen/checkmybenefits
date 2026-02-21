import { useState, useCallback } from 'react'
import { Header } from './components/shared/Header.tsx'
import { PrivacyBanner } from './components/shared/PrivacyBanner.tsx'
import { WelcomeHero } from './components/shared/WelcomeHero.tsx'
import { ConversationView } from './components/conversation/ConversationView.tsx'
import { PreResultsDisclaimer } from './components/disclaimers/PreResultsDisclaimer.tsx'
import { BundleView } from './components/bundle/BundleView.tsx'
import { ActionPlanView } from './components/action-plan/ActionPlanView.tsx'
import { ResultsFooter } from './components/disclaimers/ResultsFooter.tsx'
import { StaleDataWarning } from './components/disclaimers/StaleDataWarning.tsx'
import { useConversation } from './hooks/useConversation.ts'
import type { QuickReply } from './types/conversation.ts'

export function App() {
  const { state, handleSendMessage, handleQuickReply } = useConversation()
  const [showHero, setShowHero] = useState(true)
  const [showAbout, setShowAbout] = useState(false)

  const dismissHero = useCallback(() => setShowHero(false), [])
  const toggleAbout = useCallback(() => setShowAbout((prev) => !prev), [])

  const handleSendWithHeroDismiss = useCallback(
    (text: string) => {
      if (showHero) setShowHero(false)
      handleSendMessage(text)
    },
    [showHero, handleSendMessage],
  )

  const handleQuickReplyWithHeroDismiss = useCallback(
    (reply: QuickReply) => {
      if (showHero) setShowHero(false)
      handleQuickReply(reply)
    },
    [showHero, handleQuickReply],
  )

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header onAboutToggle={toggleAbout} isAboutOpen={showAbout} />
      <PrivacyBanner />

      {showHero && <WelcomeHero onGetStarted={dismissHero} />}

      <main className="main-content" id="main-content">
        <ConversationView
          messages={state.messages}
          isLoading={state.isLoading}
          onSendMessage={handleSendWithHeroDismiss}
          onQuickReply={handleQuickReplyWithHeroDismiss}
        />

        {state.bundle && (
          <div className="results-section">
            <PreResultsDisclaimer />
            <StaleDataWarning />
            <BundleView bundle={state.bundle} />
            <ActionPlanView steps={state.bundle.action_plan} />
            <ResultsFooter />
          </div>
        )}
      </main>
    </div>
  )
}
