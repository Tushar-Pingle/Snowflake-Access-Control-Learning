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
  grantRoleToUser,
  type AccountModel,
} from '../../engine'

function seed(primary: string, secondary: 'ALL' | 'NONE'): AccountModel {
  const m = account()
  addRole(m, 'DEV')
  addRole(m, 'BUILDER')
  addWarehouse(m, 'wh:WH', 'WH', 'SYSADMIN', { running: true })
  addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
  addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
  addTableLike(m, 'table', 'table:SALES.PUBLIC.T', 'T', 'SYSADMIN', 'schema:SALES.PUBLIC')
  for (const r of ['DEV', 'BUILDER']) {
    grantPriv(m, 'USAGE', 'wh:WH', r)
    grantPriv(m, 'USAGE', 'db:SALES', r)
    grantPriv(m, 'USAGE', 'schema:SALES.PUBLIC', r)
  }
  grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.T', 'BUILDER')
  grantPriv(m, 'CREATE TABLE', 'schema:SALES.PUBLIC', 'BUILDER')
  addUser(m, 'bob', primary, secondary)
  grantRoleToUser(m, 'BUILDER', 'bob')
  return m
}

export function SecondaryRoleDemo() {
  const [primary, setPrimary] = useState('DEV')
  const [secondary, setSecondary] = useState<'ALL' | 'NONE'>('ALL')

  const { canSelect, canCreate } = useMemo(() => {
    const m = seed(primary, secondary)
    return {
      canSelect: explainAccess(m, m.users.bob, { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.T', warehouseId: 'wh:WH' }).allowed,
      canCreate: explainAccess(m, m.users.bob, { kind: 'CREATE', objectType: 'table', containerId: 'schema:SALES.PUBLIC' }).allowed,
    }
  }, [primary, secondary])

  return (
    <div className="widget card">
      <p className="dim">Bob's <strong>BUILDER</strong> role (which can SELECT and CREATE TABLE) is granted to him. Change how his session activates roles:</p>
      <div className="row" style={{ marginBottom: 8 }}>
        <span className="muted">Primary (USE ROLE):</span>
        <button className={`chip ${primary === 'DEV' ? 'active' : ''}`} onClick={() => setPrimary('DEV')}>DEV</button>
        <button className={`chip ${primary === 'BUILDER' ? 'active' : ''}`} onClick={() => setPrimary('BUILDER')}>BUILDER</button>
      </div>
      <div className="row" style={{ marginBottom: 14 }}>
        <span className="muted">Secondary roles:</span>
        <button className={`chip ${secondary === 'ALL' ? 'active' : ''}`} onClick={() => setSecondary('ALL')}>ALL</button>
        <button className={`chip ${secondary === 'NONE' ? 'active' : ''}`} onClick={() => setSecondary('NONE')}>NONE</button>
      </div>
      <div className={`chain-verdict ${canSelect ? 'ok' : 'bad'}`} style={{ marginBottom: 6 }}>
        {canSelect ? '✓' : '✕'} SELECT from T — honors secondary roles
      </div>
      <div className={`chain-verdict ${canCreate ? 'ok' : 'bad'}`}>
        {canCreate ? '✓' : '✕'} CREATE TABLE — uses the PRIMARY role only
      </div>
    </div>
  )
}
