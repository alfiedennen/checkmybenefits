interface Props {
  situationDescription: string
}

export function OutOfScopeMessage({ situationDescription }: Props) {
  return (
    <div className="out-of-scope">
      <p>
        It sounds like you're dealing with {situationDescription}. We're still building
        our coverage of this area, so we can't give you a detailed assessment right now.
      </p>
      <p>In the meantime, we'd recommend:</p>
      <ul>
        <li>
          <strong>Citizens Advice</strong> —{' '}
          <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer">
            citizensadvice.org.uk
          </a>{' '}
          or call 0800 144 8848
        </li>
        <li>
          <strong>GOV.UK</strong> —{' '}
          <a href="https://www.gov.uk/browse/benefits" target="_blank" rel="noopener noreferrer">
            gov.uk/browse/benefits
          </a>
        </li>
      </ul>
      <p className="out-of-scope-note">We're adding more situations soon — check back later.</p>
    </div>
  )
}
