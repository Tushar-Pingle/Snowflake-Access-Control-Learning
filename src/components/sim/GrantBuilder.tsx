import { useMemo, useState } from 'react'
import { qualifiedName, type AccountModel, type Privilege } from '../../engine'

const PRIVS: Privilege[] = ['USAGE', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'OPERATE', 'MODIFY', 'MONITOR', 'CREATE TABLE', 'CREATE SCHEMA', 'OWNERSHIP']

/** Compact builder that composes a GRANT statement and hands it back to the worksheet. */
export function GrantBuilder({ model, onInsert }: { model: AccountModel; onInsert: (sql: string) => void }) {
  const objects = useMemo(
    () => Object.values(model.objects).filter((o) => o.type !== 'account'),
    [model],
  )
  const roles = useMemo(() => Object.values(model.roles).map((r) => r.name), [model])

  const [mode, setMode] = useState<'priv' | 'role' | 'use'>('priv')
  const [priv, setPriv] = useState<Privilege>('USAGE')
  const [objectId, setObjectId] = useState(objects[0]?.id ?? '')
  const [toRole, setToRole] = useState(roles[0] ?? '')
  const [childRole, setChildRole] = useState(roles[0] ?? '')

  const objType = (id: string) => model.objects[id]?.type.toUpperCase() ?? 'TABLE'

  const build = (): string => {
    if (mode === 'use') return `USE ROLE ${toRole}`
    if (mode === 'role') return `GRANT ROLE ${childRole} TO ROLE ${toRole}`
    const obj = model.objects[objectId]
    if (!obj) return ''
    return `GRANT ${priv} ON ${objType(objectId)} ${qualifiedName(model, objectId)} TO ROLE ${toRole}`
  }

  return (
    <div className="grant-builder">
      <div className="row" style={{ marginBottom: 8 }}>
        <button className={`chip ${mode === 'priv' ? 'active' : ''}`} onClick={() => setMode('priv')}>Grant privilege</button>
        <button className={`chip ${mode === 'role' ? 'active' : ''}`} onClick={() => setMode('role')}>Grant role</button>
        <button className={`chip ${mode === 'use' ? 'active' : ''}`} onClick={() => setMode('use')}>Use role</button>
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {mode === 'priv' && (
          <>
            <select className="select" value={priv} onChange={(e) => setPriv(e.target.value as Privilege)}>
              {PRIVS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="muted">on</span>
            <select className="select" value={objectId} onChange={(e) => setObjectId(e.target.value)}>
              {objects.map((o) => <option key={o.id} value={o.id}>{objType(o.id)} {qualifiedName(model, o.id)}</option>)}
            </select>
            <span className="muted">to</span>
            <select className="select" value={toRole} onChange={(e) => setToRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </>
        )}
        {mode === 'role' && (
          <>
            <select className="select" value={childRole} onChange={(e) => setChildRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <span className="muted">to role</span>
            <select className="select" value={toRole} onChange={(e) => setToRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </>
        )}
        {mode === 'use' && (
          <select className="select" value={toRole} onChange={(e) => setToRole(e.target.value)}>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        <button className="btn btn-sm btn-primary" onClick={() => onInsert(build())}>+ Add</button>
      </div>
      <div className="muted" style={{ fontSize: '0.78rem', marginTop: 8 }}>Preview: <code>{build()}</code></div>
    </div>
  )
}
