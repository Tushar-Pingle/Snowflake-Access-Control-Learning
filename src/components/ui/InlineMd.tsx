import { type ReactNode, Fragment } from 'react'

/**
 * Tiny inline-markdown renderer supporting `code`, **bold**, *italic*, and
 * [label](url). Code spans are extracted first so markup inside them is literal.
 */
export function renderInline(text: string, keyPrefix = ''): ReactNode[] {
  const out: ReactNode[] = []
  // Split on code spans first.
  const codeParts = text.split(/(`[^`]+`)/g)
  codeParts.forEach((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      out.push(<code key={`${keyPrefix}c${i}`}>{part.slice(1, -1)}</code>)
    } else {
      out.push(...renderEmphasis(part, `${keyPrefix}e${i}`))
    }
  })
  return out
}

function renderEmphasis(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = []
  // Pattern order: links, bold, italic.
  const regex = /(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let idx = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={`${keyPrefix}t${idx}`}>{text.slice(last, m.index)}</Fragment>)
    const token = m[0]
    if (token.startsWith('[')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        out.push(
          <a key={`${keyPrefix}l${idx}`} href={linkMatch[2]} target="_blank" rel="noreferrer">
            {linkMatch[1]}
          </a>,
        )
      }
    } else if (token.startsWith('**')) {
      out.push(<strong key={`${keyPrefix}b${idx}`}>{token.slice(2, -2)}</strong>)
    } else {
      out.push(<em key={`${keyPrefix}i${idx}`}>{token.slice(1, -1)}</em>)
    }
    last = m.index + token.length
    idx++
  }
  if (last < text.length) out.push(<Fragment key={`${keyPrefix}t${idx}`}>{text.slice(last)}</Fragment>)
  return out
}

export function InlineMd({ text }: { text: string }) {
  return <>{renderInline(text)}</>
}
