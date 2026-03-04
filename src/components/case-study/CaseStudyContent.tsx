import { CaseStudyHeader } from './CaseStudyHeader.tsx'
import { CaseStudyNav } from './CaseStudyNav.tsx'
import { Footer } from '../shared/Footer.tsx'
import { HeroSection } from './sections/HeroSection.tsx'
import { FormatSection } from './sections/FormatSection.tsx'
import { ProblemSection } from './sections/ProblemSection.tsx'
import { DiagnosisSection } from './sections/DiagnosisSection.tsx'
import { StakeholdersSection } from './sections/StakeholdersSection.tsx'
import { StrategySection } from './sections/StrategySection.tsx'
import { TeamsSection } from './sections/TeamsSection.tsx'
import { DecisionsSection } from './sections/DecisionsSection.tsx'
import { TryItSection } from './sections/TryItSection.tsx'
import { CloseSection } from './sections/CloseSection.tsx'

const SECTIONS = [
  { id: 'format', label: 'Format' },
  { id: 'problem', label: 'Problem' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'stakeholders', label: 'Stakeholders' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'teams', label: 'Teams' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'try-it', label: 'Try It' },
]

export function CaseStudyContent() {
  return (
    <div className="app cs-app">
      <CaseStudyHeader />
      <CaseStudyNav sections={SECTIONS} />
      <main className="cs-main">
        <HeroSection />
        <FormatSection />
        <ProblemSection />
        <DiagnosisSection />
        <StakeholdersSection />
        <StrategySection />
        <TeamsSection />
        <DecisionsSection />
        <TryItSection />
        <CloseSection />
      </main>
      <Footer />
    </div>
  )
}
