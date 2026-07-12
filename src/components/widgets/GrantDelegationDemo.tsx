import { useMemo, useState } from 'react'
import {
  account,
  addDatabase,
  addRole,
  addSchema,
  addTableLike,
  canGrant,
  grantPriv,
  roleClosure,
  withSystemRoles,
} from '../../engine'

type Path = 'owner' | 'manage' | 'wgo' | 'none'

const PATHS: { key: Path; label: string; desc: string }[] = [
  { key: 'owner', label: 'Object owner', desc: 'DEV owns the ORDERS table (OWNERSHIP).' },
  { key: 'manage', label: 'MANAGE GRANTS', desc: 'DEV holds the global MANAGE GRANTS privilege (like SECURITYADMIN).' },
  { key: 'wgo', label: 'WITH GRANT OPTION', desc: 'DEV was granted SELECT on ORDERS WITH GRANT OPTION.' },
  { key: 'none', label: 'None of these', desc: 'DEV only has plain SELECT on ORDERS.' },
]

export function GrantDelegationDemo() {
  const [path, setPath] = useState<Path>('owner')

  const result = useMemo(() => {
    const m = withSystemRoles(account())
    addRole(m, 'DEV')
    addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
    addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
    addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', path === 'owner' ? 'DEV' : 'SYSADMIN', 'schema:SALES.PUBLIC')
    if (path === 'manage') grantPriv(m, 'MANAGE GRANTS', 'account:FROSTBYTE', 'DEV')
    if (path === 'wgo') grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.ORDERS', 'DEV', true)
    if (path === 'none') grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.ORDERS', 'DEV')
    return canGrant(m, roleClosure(m, ['DEV']), 'SELECT', 'table:SALES.PUBLIC.ORDERS')
  }, [path])

  return (
    <div className="widget card">
      <p className="dim">Can role <code>DEV</code> run <code>GRANT SELECT ON TABLE ORDERS TO ROLE ANALYST</code>? Pick DEV's situation:</p>
      <div className="row" style={{ marginBottom: 12 }}>
        {PATHS.map((p) => (
          <button key={p.key} className={`chip ${path === p.key ? 'active' : ''}`} onClick={() => setPath(p.key)}>{p.label}</button>
        ))}
      </div>
      <p className="muted" style={{ fontSize: '0.86rem' }}>{PATHS.find((p) => p.key === path)!.desc}</p>
      <div className={`chain-verdict ${result.ok ? 'ok' : 'bad'}`}>
        {result.ok ? '✓ Allowed' : '✕ Denied'} — {result.reason}
      </div>
    </div>
  )
}
