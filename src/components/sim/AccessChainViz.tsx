import type { AccessExplanation } from '../../engine'

/** Renders an AccessExplanation as a vertical chain of green/red links. */
export function AccessChainViz({ explanation, title }: { explanation: AccessExplanation; title?: string }) {
  return (
    <div className="chain">
      {title && <div className="chain-title">{title}</div>}
      <ol className="chain-list">
        {explanation.links.map((link, i) => (
          <li key={i} className={`chain-link ${link.ok ? 'ok' : 'bad'}`}>
            <span className="chain-dot" aria-hidden>{link.ok ? '✓' : '✕'}</span>
            <div className="chain-body">
              <div className="chain-label">{link.label}</div>
              {link.ok && link.via && <div className="chain-via">{link.via}</div>}
              {!link.ok && link.fix && <div className="chain-fix">{link.fix}</div>}
              {link.ok && !link.via && link.detail && <div className="chain-via">{link.detail}</div>}
            </div>
          </li>
        ))}
      </ol>
      <div className={`chain-verdict ${explanation.allowed ? 'ok' : 'bad'}`}>
        {explanation.allowed ? '✓' : '✕'} {explanation.summary}
      </div>
      {explanation.activeRoles.length > 0 && (
        <div className="chain-roles">
          Active roles: {explanation.activeRoles.map((r) => (
            <span key={r} className="badge badge-muted" style={{ marginRight: 4 }}>{r}</span>
          ))}
        </div>
      )}
    </div>
  )
}
