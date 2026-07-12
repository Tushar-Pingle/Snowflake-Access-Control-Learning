import { useMemo, useState } from 'react'
import {
  account,
  addDatabase,
  addRole,
  addSchema,
  addTableLike,
  canGrant,
  roleClosure,
  withSystemRoles,
} from '../../engine'

/** Toggle managed access and see the table owner (DEV) lose grant authority. */
export function ManagedAccessDemo() {
  const [managed, setManaged] = useState(false)

  const { devCanGrant, schemaOwnerCanGrant, secAdminCanGrant } = useMemo(() => {
    const m = withSystemRoles(account())
    addRole(m, 'DEV')
    addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
    addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES', managed)
    addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'DEV', 'schema:SALES.PUBLIC')
    return {
      devCanGrant: canGrant(m, roleClosure(m, ['DEV']), 'SELECT', 'table:SALES.PUBLIC.ORDERS').ok,
      schemaOwnerCanGrant: canGrant(m, roleClosure(m, ['SYSADMIN']), 'SELECT', 'table:SALES.PUBLIC.ORDERS').ok,
      secAdminCanGrant: canGrant(m, roleClosure(m, ['SECURITYADMIN']), 'SELECT', 'table:SALES.PUBLIC.ORDERS').ok,
    }
  }, [managed])

  const Row = ({ label, ok, note }: { label: string; ok: boolean; note: string }) => (
    <div className={`chain-link ${ok ? 'ok' : 'bad'}`} style={{ marginBottom: 6 }}>
      <span className="chain-dot">{ok ? '✓' : '✕'}</span>
      <div className="chain-body">
        <div className="chain-label">{label}</div>
        <div className="chain-via">{note}</div>
      </div>
    </div>
  )

  return (
    <div className="widget card">
      <p className="dim"><code>DEV</code> owns the <code>ORDERS</code> table. <code>SYSADMIN</code> owns the schema. Toggle managed access:</p>
      <button className={`switch ${managed ? 'on' : ''}`} onClick={() => setManaged((x) => !x)} style={{ maxWidth: 380, marginBottom: 14 }}>
        <span className="switch-knob" />
        <span className="switch-label">Schema SALES.PUBLIC WITH MANAGED ACCESS</span>
        <span className={`switch-state ${managed ? 'on' : ''}`}>{managed ? 'on' : 'off'}</span>
      </button>
      <Row label="DEV (table owner) can GRANT SELECT" ok={devCanGrant} note={managed ? 'Managed access strips the object owner’s grant authority.' : 'Normal schema: the owner may grant.'} />
      <Row label="SYSADMIN (schema owner) can GRANT SELECT" ok={schemaOwnerCanGrant} note="The schema owner always may grant here." />
      <Row label="SECURITYADMIN (MANAGE GRANTS) can GRANT SELECT" ok={secAdminCanGrant} note="MANAGE GRANTS works in either mode." />
    </div>
  )
}
