import { Header } from './components/shared/Header.tsx'
import { PrivacyBanner } from './components/shared/PrivacyBanner.tsx'
import { ConversationView } from './components/conversation/ConversationView.tsx'
import { PreResultsDisclaimer } from './components/disclaimers/PreResultsDisclaimer.tsx'
import { BundleView } from './components/bundle/BundleView.tsx'
import { ActionPlanView } from './components/action-plan/ActionPlanView.tsx'
import { ResultsFooter } from './components/disclaimers/ResultsFooter.tsx'
import { StaleDataWarning } from './components/disclaimers/StaleDataWarning.tsx'
import { useConversation } from './hooks/useConversation.ts'

export function App() {
  const { state, handleSendMessage, handleQuickReply } = useConversation()

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header />
      <PrivacyBanner />

      <main className="main-content" id="main-content">
        <ConversationView
          messages={state.messages}
          isLoading={state.isLoading}
          onSendMessage={handleSendMessage}
          onQuickReply={handleQuickReply}
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
