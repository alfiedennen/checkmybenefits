interface Props {
  url?: string
  method: string
}

export function ApplyLink({ url, method }: Props) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="apply-link"
      >
        Start this claim <span className="sr-only">(opens in new tab)</span>
      </a>
    )
  }

  return <span className="apply-method">{method}</span>
}
