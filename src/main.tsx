import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './App.css'

const CaseStudyPage = lazy(() =>
  import('./components/case-study/CaseStudyPage.tsx').then((m) => ({ default: m.CaseStudyPage }))
)

const path = window.location.pathname
const isCaseStudy = path === '/case-study' || path === '/case-study/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isCaseStudy ? (
      <Suspense fallback={null}>
        <CaseStudyPage />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
