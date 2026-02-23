export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <nav className="site-footer-links" aria-label="Footer links">
          <a href="https://www.gov.uk/browse/benefits" target="_blank" rel="noopener noreferrer">
            Benefits on GOV.UK
          </a>
          <a href="https://www.citizensadvice.org.uk/benefits/" target="_blank" rel="noopener noreferrer">
            Citizens Advice
          </a>
          <a href="mailto:feedback@checkmybenefits.uk">Feedback</a>
        </nav>
        <p className="site-footer-disclaimer">
          This is an independent tool and is not affiliated with or endorsed by HM Government.
          Results are estimates based on publicly available information about benefit rates and rules.
          Always verify your entitlement through official channels.
        </p>
        <p className="site-footer-privacy">
          Your privacy matters. Nothing you type is stored. We use privacy-friendly analytics
          to count page views — no personal data is collected.
        </p>
      </div>
    </footer>
  )
}
