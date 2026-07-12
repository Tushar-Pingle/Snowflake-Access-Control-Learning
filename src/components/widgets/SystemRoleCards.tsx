import { SYSTEM_ROLES } from '../../content/systemRoles'

export function SystemRoleCards() {
  return (
    <div className="widget grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
      {SYSTEM_ROLES.map((r) => (
        <div key={r.name} className="card card-hover" style={{ borderTop: `3px solid ${r.accent}` }}>
          <h3 style={{ color: r.accent, marginBottom: 2 }}>{r.name}</h3>
          <div className="muted" style={{ fontSize: '0.82rem', marginBottom: 10 }}>{r.tagline}</div>
          <ul className="tight">
            {r.responsibilities.slice(0, 3).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {r.note && <p className="muted" style={{ fontSize: '0.8rem', marginTop: 8, marginBottom: 0 }}>⚑ {r.note}</p>}
        </div>
      ))}
    </div>
  )
}
