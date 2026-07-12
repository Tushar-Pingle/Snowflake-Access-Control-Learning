import { useState } from 'react'
import {
  account,
  addDatabase,
  addRole,
  addSchema,
  addUser,
  applyOp,
  grantFuture,
  withSystemRoles,
  type AccountModel,
} from '../../engine'

function seed(): AccountModel {
  const m = withSystemRoles(account())
  addRole(m, 'ANALYST')
  addRole(m, 'REPORTER')
  addUser(m, 'sys', 'SYSADMIN')
  addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
  addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
  addSchema(m, 'schema:SALES.RAW', 'RAW', 'SYSADMIN', 'db:SALES')
  // Schema-level future grant on PUBLIC → ANALYST; database-level future grant → REPORTER
  grantFuture(m, 'SELECT', 'table', { kind: 'SCHEMA', containerId: 'schema:SALES.PUBLIC' }, 'ANALYST')
  grantFuture(m, 'SELECT', 'table', { kind: 'DATABASE', containerId: 'db:SALES' }, 'REPORTER')
  return m
}

export function FutureGrantDemo() {
  const [log, setLog] = useState<{ table: string; grantees: string[] }[]>([])
  const [counter, setCounter] = useState(1)

  const createIn = (schemaId: string, schemaName: string) => {
    const m = seed()
    const id = `table:SALES.${schemaName}.T${counter}`
    const res = applyOp(m, 'sys', {
      op: 'CREATE_OBJECT',
      object: { id, type: 'table', name: `T${counter}`, parentId: schemaId, owner: 'PUBLIC' },
    })
    const grantees = res.model.privGrants.filter((g) => g.objectId === id).map((g) => g.grantee)
    setLog((l) => [{ table: `SALES.${schemaName}.T${counter}`, grantees }, ...l].slice(0, 6))
    setCounter((c) => c + 1)
  }

  return (
    <div className="widget card">
      <p className="dim">
        <code>SALES.PUBLIC</code> has a <strong>schema-level</strong> future grant → ANALYST. <code>SALES</code> has a
        <strong> database-level</strong> future grant → REPORTER. Create tables and see which future grant fires (schema shadows database).
      </p>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn btn-sm btn-primary" onClick={() => createIn('schema:SALES.PUBLIC', 'PUBLIC')}>Create table in SALES.PUBLIC</button>
        <button className="btn btn-sm btn-primary" onClick={() => createIn('schema:SALES.RAW', 'RAW')}>Create table in SALES.RAW</button>
        <button className="btn btn-sm btn-ghost" onClick={() => { setLog([]); setCounter(1) }}>Clear</button>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        {log.length === 0 && <p className="muted">Create a table to see the resulting grants.</p>}
        {log.map((entry, i) => (
          <div key={i} className="chain-link ok" style={{ background: 'var(--surface-2)' }}>
            <span className="chain-dot" style={{ background: 'transparent', color: 'var(--accent)' }}>⊕</span>
            <div className="chain-body">
              <div className="chain-label">Created <code>{entry.table}</code></div>
              <div className="chain-via">
                Auto-granted SELECT to: {entry.grantees.length ? entry.grantees.map((g) => <span key={g} className="badge" style={{ marginRight: 4 }}>{g}</span>) : <em>nobody</em>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
