import { Fragment, type ReactNode, useState } from 'react'

const KEYWORDS = new Set([
  'GRANT', 'REVOKE', 'ON', 'TO', 'FROM', 'ROLE', 'USER', 'DATABASE', 'SCHEMA', 'TABLE', 'VIEW',
  'WAREHOUSE', 'STAGE', 'STREAM', 'TASK', 'FUNCTION', 'WITH', 'CREATE', 'USE', 'SECONDARY', 'ROLES',
  'ALL', 'NONE', 'FUTURE', 'IN', 'MANAGED', 'ACCESS', 'CURRENT', 'GRANTS', 'COPY', 'OPTION', 'OF',
  'ALTER', 'SET', 'SHOW', 'AND', 'OR', 'AS', 'RETURNS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'ENABLE', 'ADD', 'MODIFY', 'COLUMN', 'BOOLEAN', 'STRING', 'EXISTS', 'WHERE', 'PRIVILEGES',
])
const PRIVS = new Set([
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'USAGE', 'OPERATE', 'MONITOR', 'REFERENCES',
  'READ', 'WRITE', 'OWNERSHIP', 'MANAGE', 'APPLY', 'MASKING', 'POLICY', 'IMPORTED',
])

function highlightCode(code: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const lines = code.split('\n')
  lines.forEach((line, li) => {
    const commentIdx = line.indexOf('--')
    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line
    const comment = commentIdx >= 0 ? line.slice(commentIdx) : ''
    const tokens = codePart.match(/(\s+|'[^']*'|[A-Za-z_][A-Za-z0-9_$]*|[(),.;=<>-]+|\S)/g) ?? []
    tokens.forEach((tok, ti) => {
      const key = `${li}-${ti}`
      if (/^\s+$/.test(tok)) {
        nodes.push(<Fragment key={key}>{tok}</Fragment>)
      } else if (tok.startsWith("'")) {
        nodes.push(<span key={key} className="tok-str">{tok}</span>)
      } else if (/^[A-Za-z_]/.test(tok)) {
        const up = tok.toUpperCase()
        const cls = KEYWORDS.has(up) ? 'tok-kw' : PRIVS.has(up) ? 'tok-priv' : 'tok-obj'
        nodes.push(<span key={key} className={cls}>{tok}</span>)
      } else if (/^[(),.;=<>-]+$/.test(tok)) {
        nodes.push(<span key={key} className="tok-punc">{tok}</span>)
      } else {
        nodes.push(<Fragment key={key}>{tok}</Fragment>)
      }
    })
    if (comment) nodes.push(<span key={`c${li}`} className="tok-com">{comment}</span>)
    if (li < lines.length - 1) nodes.push(<Fragment key={`nl${li}`}>{'\n'}</Fragment>)
  })
  return nodes
}

export function SqlBlock({ code, caption }: { code: string; caption?: string }) {
  const [copied, setCopied] = useState(false)
  const trimmed = code.replace(/^\n+|\n+$/g, '')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trimmed)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div className="sql">
      {caption && <div className="sql-caption">{caption}</div>}
      <button className="copy-btn" onClick={copy} aria-label="Copy SQL">
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre>
        <code>{highlightCode(trimmed)}</code>
      </pre>
    </div>
  )
}
