import { useMemo, useState } from 'react'
import { PRIVILEGES, PRIV_CATEGORIES, type PrivCategory } from '../../content/privileges'

export function PrivilegeExplorer() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<PrivCategory | 'All'>('All')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PRIVILEGES.filter((p) => {
      if (cat !== 'All' && p.category !== cat) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.appliesTo.some((a) => a.toLowerCase().includes(q))
      )
    })
  }, [query, cat])

  return (
    <div className="widget">
      <div className="spread" style={{ marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Search privileges…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search privileges"
        />
        <span className="muted" style={{ fontSize: '0.82rem' }}>{filtered.length} of {PRIVILEGES.length}</span>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={`chip ${cat === 'All' ? 'active' : ''}`} onClick={() => setCat('All')}>All</button>
        {PRIV_CATEGORIES.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="priv-table">
        {filtered.map((p) => (
          <div key={p.name} className="priv-row">
            <div>
              <code className="priv-name">{p.name}</code>
              <div className="row" style={{ marginTop: 4 }}>
                {p.appliesTo.map((a) => (
                  <span key={a} className="badge badge-muted">{a}</span>
                ))}
              </div>
            </div>
            <div className="dim">{p.description}</div>
          </div>
        ))}
        {filtered.length === 0 && <p className="muted center">No privileges match your search.</p>}
      </div>
    </div>
  )
}
