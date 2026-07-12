import { useMemo, useState } from 'react'
import {
  applyOps,
  explainAccess,
  parseSql,
  qualifiedName,
  type AccountModel,
  type DmlKind,
} from '../engine'
import { frostbyteBase } from '../content/scenarios'
import { GrantBuilder } from '../components/sim/GrantBuilder'
import { AccessChainViz } from '../components/sim/AccessChainViz'

const VERBS: DmlKind[] = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

export function SandboxPage() {
  const base = useMemo(() => frostbyteBase(), [])
  const [sql, setSql] = useState('')
  const [model, setModel] = useState<AccountModel>(base)
  const [errors, setErrors] = useState<string[]>([])

  // access checker state
  const tables = useMemo(() => Object.values(model.objects).filter((o) => o.type === 'table' || o.type === 'view'), [model])
  const warehouses = useMemo(() => Object.values(model.objects).filter((o) => o.type === 'warehouse'), [model])
  const users = useMemo(() => Object.values(model.users), [model])
  const [user, setUser] = useState(users[0]?.name ?? '')
  const [verb, setVerb] = useState<DmlKind>('SELECT')
  const [objectId, setObjectId] = useState(tables[0]?.id ?? '')
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '')

  const run = () => {
    const { ops, errors: parseErrors } = parseSql(base, sql)
    const { model: m, errors: applyErrors } = applyOps(base, 'sec', ops, { enforceGrantAuth: false })
    setModel(m)
    setErrors([...parseErrors.map((e) => `Parse: ${e.error}`), ...applyErrors.map((e) => `Statement ${e.index + 1}: ${e.error}`)])
  }

  const explanation = useMemo(() => {
    const u = model.users[user]
    if (!u) return null
    return explainAccess(model, u, { kind: verb, objectId, warehouseId })
  }, [model, user, verb, objectId, warehouseId])

  return (
    <div className="container">
      <h1>Sandbox</h1>
      <p className="dim" style={{ maxWidth: 720 }}>
        A live model of the <strong>Frostbyte Inc.</strong> account. Write grants in the worksheet and run them, then use the access checker
        to see exactly why any action is allowed or denied. Grants here are applied as an all-powerful admin, so experiment freely.
      </p>

      <div className="grid sandbox-grid">
        <div className="stack">
          <div className="card">
            <div className="spread" style={{ marginBottom: 8 }}><strong>Worksheet</strong><span className="muted" style={{ fontSize: '0.78rem' }}>GRANT / REVOKE / USE</span></div>
            <GrantBuilder model={base} onInsert={(stmt) => setSql((s) => (s ? `${s.replace(/\s*$/, '')}\n${stmt};` : `${stmt};`))} />
            <textarea
              className="sql-editor"
              rows={8}
              spellCheck={false}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder={'-- e.g.\nGRANT USAGE ON WAREHOUSE ANALYTICS_WH TO ROLE ANALYST;\nGRANT USAGE ON DATABASE SALES TO ROLE ANALYST;\nGRANT USAGE ON SCHEMA SALES.PUBLIC TO ROLE ANALYST;\nGRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE ANALYST;'}
            />
            <div className="row">
              <button className="btn btn-primary" onClick={run}>▶ Run</button>
              <button className="btn btn-ghost" onClick={() => { setSql(''); setModel(base); setErrors([]) }}>Reset model</button>
            </div>
            {errors.length > 0 && <div className="q-feedback bad" style={{ marginTop: 10 }}>{errors.map((e, i) => <div key={i}>{e}</div>)}</div>}
          </div>

          <ModelInspector model={model} />
        </div>

        <div className="stack">
          <div className="card">
            <strong>Access checker</strong>
            <div className="row" style={{ margin: '10px 0', gap: 6 }}>
              <select className="select" value={user} onChange={(e) => setUser(e.target.value)}>
                {users.map((u) => <option key={u.name} value={u.name}>{u.name} (as {u.primaryRole})</option>)}
              </select>
              <select className="select" value={verb} onChange={(e) => setVerb(e.target.value as DmlKind)}>
                {VERBS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <span className="muted">from</span>
              <select className="select" value={objectId} onChange={(e) => setObjectId(e.target.value)}>
                {tables.map((t) => <option key={t.id} value={t.id}>{qualifiedName(model, t.id)}</option>)}
              </select>
              <span className="muted">on</span>
              <select className="select" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}{w.running ? '' : ' (suspended)'}</option>)}
              </select>
            </div>
            {explanation && <AccessChainViz explanation={explanation} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function ModelInspector({ model }: { model: AccountModel }) {
  return (
    <div className="card">
      <strong>Current grants</strong>
      <div className="inspector">
        <div className="muted" style={{ fontSize: '0.78rem', margin: '8px 0 4px', fontWeight: 700 }}>Privilege grants</div>
        {model.privGrants.length === 0 && <p className="muted">None yet.</p>}
        <div className="stack" style={{ gap: 3 }}>
          {model.privGrants.map((g, i) => (
            <code key={i} className="inspector-line">
              {g.privilege} on {qualifiedName(model, g.objectId)} → {g.grantee}{g.withGrantOption ? ' (WGO)' : ''}
            </code>
          ))}
        </div>
        <div className="muted" style={{ fontSize: '0.78rem', margin: '10px 0 4px', fontWeight: 700 }}>Role grants</div>
        <div className="stack" style={{ gap: 3 }}>
          {model.roleGrants.map((g, i) => (
            <code key={i} className="inspector-line">
              {g.role} → {'role' in g.grantedTo ? `ROLE ${g.grantedTo.role}` : `USER ${g.grantedTo.user}`}
            </code>
          ))}
        </div>
      </div>
    </div>
  )
}
