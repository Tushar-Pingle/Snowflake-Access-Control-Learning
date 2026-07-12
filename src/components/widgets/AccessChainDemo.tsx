import { useMemo, useState } from 'react'
import {
  account,
  addDatabase,
  addRole,
  addSchema,
  addTableLike,
  addUser,
  addWarehouse,
  explainAccess,
  grantPriv,
  type AccountModel,
} from '../../engine'
import { AccessChainViz } from '../sim/AccessChainViz'

interface Toggles {
  whUsage: boolean
  whRunning: boolean
  dbUsage: boolean
  schemaUsage: boolean
  tableSelect: boolean
}

function buildModel(t: Toggles): AccountModel {
  const m = account()
  addRole(m, 'ANALYST', 'account')
  addUser(m, 'alice', 'ANALYST')
  addWarehouse(m, 'wh:ANALYTICS_WH', 'ANALYTICS_WH', 'SYSADMIN', { running: t.whRunning })
  addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
  addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
  addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
  if (t.whUsage) grantPriv(m, 'USAGE', 'wh:ANALYTICS_WH', 'ANALYST')
  if (t.dbUsage) grantPriv(m, 'USAGE', 'db:SALES', 'ANALYST')
  if (t.schemaUsage) grantPriv(m, 'USAGE', 'schema:SALES.PUBLIC', 'ANALYST')
  if (t.tableSelect) grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.ORDERS', 'ANALYST')
  return m
}

const SWITCHES: { key: keyof Toggles; label: string; sql: string }[] = [
  { key: 'whUsage', label: 'USAGE on warehouse', sql: 'GRANT USAGE ON WAREHOUSE ANALYTICS_WH TO ROLE ANALYST' },
  { key: 'whRunning', label: 'Warehouse is running', sql: 'ALTER WAREHOUSE ANALYTICS_WH RESUME' },
  { key: 'dbUsage', label: 'USAGE on database', sql: 'GRANT USAGE ON DATABASE SALES TO ROLE ANALYST' },
  { key: 'schemaUsage', label: 'USAGE on schema', sql: 'GRANT USAGE ON SCHEMA SALES.PUBLIC TO ROLE ANALYST' },
  { key: 'tableSelect', label: 'SELECT on table', sql: 'GRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE ANALYST' },
]

export function AccessChainDemo() {
  const [t, setT] = useState<Toggles>({ whUsage: false, whRunning: true, dbUsage: false, schemaUsage: false, tableSelect: false })

  const explanation = useMemo(() => {
    const m = buildModel(t)
    return explainAccess(m, m.users.alice, { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' })
  }, [t])

  return (
    <div className="widget">
      <p className="dim" style={{ marginBottom: 12 }}>
        Alice runs <code>SELECT * FROM SALES.PUBLIC.ORDERS</code> as role <strong>ANALYST</strong>. Toggle the grants and watch every
        link in the chain.
      </p>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.2rem', alignItems: 'start' }}>
        <div className="stack" style={{ gap: '0.5rem' }}>
          {SWITCHES.map((s) => (
            <button
              key={s.key}
              className={`switch ${t[s.key] ? 'on' : ''}`}
              onClick={() => setT((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
              title={s.sql}
            >
              <span className="switch-knob" />
              <span className="switch-label">{s.label}</span>
              <span className={`switch-state ${t[s.key] ? 'on' : ''}`}>{t[s.key] ? 'granted' : 'off'}</span>
            </button>
          ))}
          <div className="row" style={{ marginTop: 6 }}>
            <button className="btn btn-sm" onClick={() => setT({ whUsage: true, whRunning: true, dbUsage: true, schemaUsage: true, tableSelect: true })}>Grant all</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setT({ whUsage: false, whRunning: true, dbUsage: false, schemaUsage: false, tableSelect: false })}>Reset</button>
          </div>
        </div>
        <AccessChainViz explanation={explanation} />
      </div>
    </div>
  )
}
