import { useMemo, useState } from 'react'
import {
  account,
  addRole,
  addTableLike,
  addSchema,
  addDatabase,
  grantPriv,
  grantRoleToRole,
  roleClosure,
  hasPriv,
} from '../../engine'

/** Shows how privileges flow UP the role graph: granting ANALYST into DATA_LEAD gives DATA_LEAD its access. */
export function RoleInheritanceDemo() {
  const [granted, setGranted] = useState(false)

  const { leadHasSelect, closure } = useMemo(() => {
    const m = account()
    addRole(m, 'ANALYST')
    addRole(m, 'DATA_LEAD')
    addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
    addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
    addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
    grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.ORDERS', 'ANALYST')
    if (granted) grantRoleToRole(m, 'ANALYST', 'DATA_LEAD')
    const closure = [...roleClosure(m, ['DATA_LEAD'])].filter((r) => r !== 'PUBLIC')
    const leadHasSelect = hasPriv(m, roleClosure(m, ['DATA_LEAD']), 'SELECT', 'table:SALES.PUBLIC.ORDERS').ok
    return { leadHasSelect, closure }
  }, [granted])

  return (
    <div className="widget card">
      <p className="dim">
        <code>ANALYST</code> has <code>SELECT</code> on <code>ORDERS</code>. Grant it <em>into</em> <code>DATA_LEAD</code> and watch
        the privilege flow upward.
      </p>
      <button className={`switch ${granted ? 'on' : ''}`} onClick={() => setGranted((g) => !g)} style={{ maxWidth: 340 }}>
        <span className="switch-knob" />
        <span className="switch-label">GRANT ROLE ANALYST TO ROLE DATA_LEAD</span>
        <span className={`switch-state ${granted ? 'on' : ''}`}>{granted ? 'done' : 'off'}</span>
      </button>
      <div className="row" style={{ marginTop: 14 }}>
        <span className="muted">DATA_LEAD now holds:</span>
        {closure.map((r) => (
          <span key={r} className="badge">{r}</span>
        ))}
      </div>
      <div className={`chain-verdict ${leadHasSelect ? 'ok' : 'bad'}`} style={{ marginTop: 12 }}>
        {leadHasSelect ? '✓ DATA_LEAD can SELECT ORDERS (inherited from ANALYST)' : '✕ DATA_LEAD cannot SELECT ORDERS yet'}
      </div>
    </div>
  )
}
