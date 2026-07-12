import { useState } from 'react'
import { SYSTEM_ROLES, getSystemRole } from '../../content/systemRoles'

interface Node {
  name: string
  x: number
  y: number
}

const NODES: Node[] = [
  { name: 'ACCOUNTADMIN', x: 250, y: 46 },
  { name: 'SECURITYADMIN', x: 150, y: 150 },
  { name: 'SYSADMIN', x: 360, y: 150 },
  { name: 'USERADMIN', x: 150, y: 254 },
  { name: 'PUBLIC', x: 250, y: 350 },
  { name: 'ORGADMIN', x: 480, y: 46 },
]

// child → parent (privileges flow UP from child to parent)
const EDGES: [string, string][] = [
  ['SYSADMIN', 'ACCOUNTADMIN'],
  ['SECURITYADMIN', 'ACCOUNTADMIN'],
  ['USERADMIN', 'SECURITYADMIN'],
]
// PUBLIC is granted into every role — shown as dashed edges to the leaf-most nodes.
const PUBLIC_EDGES: [string, string][] = [
  ['PUBLIC', 'USERADMIN'],
  ['PUBLIC', 'SYSADMIN'],
]

const W = 132
const H = 40

function pos(name: string) {
  return NODES.find((n) => n.name === name)!
}

export function SystemRoleHierarchy() {
  const [selected, setSelected] = useState('ACCOUNTADMIN')
  const info = getSystemRole(selected)

  const edgePath = (child: string, parent: string) => {
    const c = pos(child)
    const p = pos(parent)
    return `M ${c.x} ${c.y - H / 2} C ${c.x} ${c.y - 40}, ${p.x} ${p.y + 40}, ${p.x} ${p.y + H / 2}`
  }

  return (
    <div className="widget">
      <svg viewBox="0 0 600 400" className="role-graph" role="img" aria-label="Snowflake system role hierarchy">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-mute)" />
          </marker>
        </defs>
        {EDGES.map(([c, p]) => (
          <path key={`${c}-${p}`} d={edgePath(c, p)} fill="none" stroke="var(--text-mute)" strokeWidth={1.6} markerEnd="url(#arrow)" />
        ))}
        {PUBLIC_EDGES.map(([c, p]) => (
          <path key={`${c}-${p}`} d={edgePath(c, p)} fill="none" stroke="var(--border)" strokeWidth={1.4} strokeDasharray="4 4" markerEnd="url(#arrow)" />
        ))}
        {NODES.map((n) => {
          const role = getSystemRole(n.name)!
          const isSel = n.name === selected
          return (
            <g key={n.name} transform={`translate(${n.x - W / 2}, ${n.y - H / 2})`} style={{ cursor: 'pointer' }} onClick={() => setSelected(n.name)}>
              <rect
                width={W}
                height={H}
                rx={9}
                fill={isSel ? role.accent : 'var(--surface-2)'}
                stroke={role.accent}
                strokeWidth={isSel ? 2 : 1.4}
                opacity={isSel ? 1 : 0.95}
              />
              <text x={W / 2} y={H / 2 + 4} textAnchor="middle" fontSize="12.5" fontWeight={700} fill={isSel ? '#04121f' : 'var(--text)'}>
                {n.name}
              </text>
            </g>
          )
        })}
        <text x={480} y={92} textAnchor="middle" fontSize="10" fill="var(--text-mute)">standalone</text>
        <text x={250} y={392} textAnchor="middle" fontSize="10" fill="var(--text-mute)">granted into every role (dashed)</text>
      </svg>

      {info && (
        <div className="role-detail card" style={{ borderColor: info.accent }}>
          <div className="spread">
            <h3 style={{ margin: 0, color: info.accent }}>{info.name}</h3>
            <span className="badge" style={{ background: 'transparent', color: info.accent }}>{info.tagline}</span>
          </div>
          <ul className="tight">
            {info.responsibilities.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="row" style={{ marginTop: 8 }}>
            {info.capabilities.map((c) => (
              <span key={c} className="chip" style={{ cursor: 'default' }}>{c}</span>
            ))}
          </div>
          {info.note && <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.86rem' }}>⚑ {info.note}</p>}
        </div>
      )}
      <p className="muted" style={{ fontSize: '0.82rem', marginTop: 10 }}>
        Arrows point from a child role to the parent that inherits its privileges. Click any role to inspect it.
      </p>
      <div className="row" style={{ marginTop: 4 }}>
        {SYSTEM_ROLES.map((r) => (
          <button key={r.name} className={`chip ${r.name === selected ? 'active' : ''}`} onClick={() => setSelected(r.name)}>
            {r.name}
          </button>
        ))}
      </div>
    </div>
  )
}
