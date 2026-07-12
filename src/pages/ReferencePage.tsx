import { SystemRoleHierarchy } from '../components/widgets/SystemRoleHierarchy'
import { ObjectHierarchyTree } from '../components/widgets/ObjectHierarchyTree'
import { PrivilegeExplorer } from '../components/widgets/PrivilegeExplorer'
import { SqlBlock } from '../components/ui/SqlBlock'

export function ReferencePage() {
  return (
    <div className="container">
      <h1>Reference</h1>
      <p className="dim" style={{ maxWidth: 720 }}>Quick, always-available reference for the building blocks of Snowflake access control.</p>

      <section className="ref-section">
        <h2>System roles &amp; the default hierarchy</h2>
        <SystemRoleHierarchy />
      </section>

      <section className="ref-section">
        <h2>The securable-object hierarchy</h2>
        <ObjectHierarchyTree />
      </section>

      <section className="ref-section">
        <h2>Privilege explorer</h2>
        <PrivilegeExplorer />
      </section>

      <section className="ref-section">
        <h2>GRANT / REVOKE cheat sheet</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <SqlBlock caption="Privilege on an object → role" code={`GRANT SELECT ON TABLE db.sch.t TO ROLE r;
GRANT SELECT ON TABLE db.sch.t TO ROLE r WITH GRANT OPTION;
REVOKE SELECT ON TABLE db.sch.t FROM ROLE r;`} />
          <SqlBlock caption="Role → role / user" code={`GRANT ROLE child TO ROLE parent;
GRANT ROLE analyst TO USER alice;
REVOKE ROLE analyst FROM USER alice;`} />
          <SqlBlock caption="Ownership transfer" code={`GRANT OWNERSHIP ON TABLE db.sch.t
  TO ROLE new_owner COPY CURRENT GRANTS;
-- or REVOKE CURRENT GRANTS to strip existing grants`} />
          <SqlBlock caption="Future grants & backfill" code={`GRANT SELECT ON FUTURE TABLES IN SCHEMA db.sch TO ROLE r;
-- backfill objects that already exist:
GRANT SELECT ON ALL TABLES IN SCHEMA db.sch TO ROLE r;`} />
          <SqlBlock caption="Role activation" code={`USE ROLE analyst;              -- set the primary role
USE SECONDARY ROLES ALL;       -- activate all granted roles
USE SECONDARY ROLES NONE;      -- primary role only`} />
          <SqlBlock caption="Introspection" code={`SHOW GRANTS TO ROLE analyst;   -- privileges the role holds
SHOW GRANTS OF ROLE analyst;   -- who has the role
SHOW GRANTS ON TABLE db.sch.t; -- who can access the object`} />
        </div>
      </section>
    </div>
  )
}
