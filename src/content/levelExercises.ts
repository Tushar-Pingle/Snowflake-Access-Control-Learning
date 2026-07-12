/**
 * Simulator exercises for levels whose content modules are authored as learn+quiz
 * only. These are merged onto the levels in curriculum.ts. Each seed and goal set
 * is written against the engine API and verified by the app's runtime.
 */
import {
  account,
  addDatabase,
  addRole,
  addSchema,
  addTableLike,
  addUser,
  addWarehouse,
  grantPriv,
  grantRoleToRole,
  grantRoleToUser,
  withSystemRoles,
  type AccountModel,
} from '../engine'
import type { Exercise } from './types'

function wireContainers(m: AccountModel, managed = false, schemaId = 'schema:SALES.PUBLIC', schemaName = 'PUBLIC', schemaOwner = 'SYSADMIN') {
  addWarehouse(m, 'wh:ANALYTICS_WH', 'ANALYTICS_WH', 'SYSADMIN', { running: true, autoResume: true })
  addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
  addSchema(m, schemaId, schemaName, schemaOwner, 'db:SALES', managed)
}

// ---------- Level 5: WITH GRANT OPTION delegation ----------
function level5Seed(): AccountModel {
  const m = withSystemRoles(account())
  addRole(m, 'LEAD', 'account', 'Team lead who delegates read access')
  wireContainers(m)
  addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
  addUser(m, 'lead', 'LEAD')
  addUser(m, 'sec', 'SECURITYADMIN')
  grantRoleToUser(m, 'LEAD', 'lead')
  return m
}

const level5Exercise: Exercise = {
  id: 'delegate-with-grant-option',
  title: 'Delegate the right to grant',
  brief:
    'You want the **LEAD** role to be able to grant `SELECT` on `ORDERS` to other roles — without handing it the powerful global `MANAGE GRANTS`. Acting as **SECURITYADMIN**, give LEAD exactly that ability.',
  seed: level5Seed,
  actor: 'sec',
  starterSql: '-- Give LEAD the ability to re-grant SELECT on ORDERS.\n',
  goals: [
    {
      description: 'The LEAD role is authorized to GRANT SELECT on ORDERS',
      user: 'lead',
      action: { kind: 'GRANT', privilege: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS' },
      expect: 'allow',
    },
  ],
  leastPrivilege: {
    requiredGrants: [{ privilege: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', grantee: 'LEAD' }],
    penalizeExtra: true,
  },
  hints: [
    'This is what `WITH GRANT OPTION` is for.',
    'Run: `GRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE LEAD WITH GRANT OPTION;`',
  ],
  successMessage: 'LEAD can now re-grant SELECT — delegated granting without over-privileging. ✅',
}

// ---------- Level 6: scale access with inheritance ----------
function level6Seed(): AccountModel {
  const m = withSystemRoles(account())
  addRole(m, 'ANALYST', 'account', 'Fully-provisioned analytics role')
  addRole(m, 'DATA_LEAD', 'account', 'Analytics team lead')
  wireContainers(m)
  addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
  grantPriv(m, 'USAGE', 'wh:ANALYTICS_WH', 'ANALYST')
  grantPriv(m, 'USAGE', 'db:SALES', 'ANALYST')
  grantPriv(m, 'USAGE', 'schema:SALES.PUBLIC', 'ANALYST')
  grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.ORDERS', 'ANALYST')
  addUser(m, 'lena', 'DATA_LEAD')
  addUser(m, 'sec', 'SECURITYADMIN')
  grantRoleToUser(m, 'DATA_LEAD', 'lena')
  return m
}

const level6Exercise: Exercise = {
  id: 'inherit-access',
  title: 'Scale access with inheritance',
  brief:
    '`ANALYST` is already fully wired to read `ORDERS`. Lena holds **DATA_LEAD**, which has nothing yet. Give DATA_LEAD the same access **without re-granting a single privilege** — use the role hierarchy.',
  seed: level6Seed,
  actor: 'sec',
  starterSql: '-- Make DATA_LEAD inherit ANALYST’s access. One statement.\n',
  goals: [
    {
      description: 'Lena (DATA_LEAD) can SELECT from ORDERS',
      user: 'lena',
      action: { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' },
      expect: 'allow',
    },
  ],
  leastPrivilege: { requiredGrants: [], penalizeExtra: true },
  hints: [
    'Privileges flow up the hierarchy — grant the child role into the parent.',
    'Run: `GRANT ROLE ANALYST TO ROLE DATA_LEAD;`',
  ],
  successMessage: 'One role grant and DATA_LEAD inherited the entire access chain. That’s how RBAC scales. 🧬',
}

// ---------- Level 8: transfer ownership cleanly ----------
function level8Seed(): AccountModel {
  const m = withSystemRoles(account())
  addRole(m, 'DEV_PERSONAL', 'account', 'A departing developer’s personal role')
  addRole(m, 'DATA_ENG', 'account', 'The data-engineering functional role')
  addRole(m, 'ANALYST', 'account', 'Existing consumer of ORDERS')
  wireContainers(m)
  addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'DEV_PERSONAL', 'schema:SALES.PUBLIC')
  for (const r of ['DATA_ENG', 'ANALYST']) {
    grantPriv(m, 'USAGE', 'wh:ANALYTICS_WH', r)
    grantPriv(m, 'USAGE', 'db:SALES', r)
    grantPriv(m, 'USAGE', 'schema:SALES.PUBLIC', r)
  }
  grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.ORDERS', 'ANALYST') // existing dependent grant
  addUser(m, 'dataeng', 'DATA_ENG')
  addUser(m, 'ana', 'ANALYST')
  addUser(m, 'sec', 'SECURITYADMIN')
  grantRoleToUser(m, 'DATA_ENG', 'dataeng')
  grantRoleToUser(m, 'ANALYST', 'ana')
  return m
}

const level8Exercise: Exercise = {
  id: 'transfer-ownership',
  title: 'Transfer ownership without breaking access',
  brief:
    'The `ORDERS` table is owned by a departing developer’s personal role, **DEV_PERSONAL**. Transfer ownership to the **DATA_ENG** functional role — while keeping the existing `SELECT` that **ANALYST** already relies on. Acting as **SECURITYADMIN**.',
  seed: level8Seed,
  actor: 'sec',
  starterSql: '-- Transfer ownership of ORDERS to DATA_ENG, preserving current grants.\n',
  goals: [
    {
      description: 'DATA_ENG now owns ORDERS (so dataeng can read it)',
      user: 'dataeng',
      action: { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' },
      expect: 'allow',
    },
    {
      description: 'ANALYST’s existing SELECT is preserved (ana can still read it)',
      user: 'ana',
      action: { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' },
      expect: 'allow',
    },
  ],
  hints: [
    'Ownership transfer that keeps existing grants uses `COPY CURRENT GRANTS`.',
    'Run: `GRANT OWNERSHIP ON TABLE SALES.PUBLIC.ORDERS TO ROLE DATA_ENG COPY CURRENT GRANTS;`',
    'Using `REVOKE CURRENT GRANTS` instead would strip ANALYST’s SELECT and fail the second goal.',
  ],
  successMessage: 'Ownership moved to a durable functional role and no one lost access. Clean handover. 🏷️',
}

// ---------- Level 9: grant inside a managed-access schema ----------
function level9Seed(): AccountModel {
  const m = withSystemRoles(account())
  addRole(m, 'SCHEMA_OWNER', 'account', 'Owns the secure schema')
  addRole(m, 'ANALYST', 'account', 'Needs read access')
  addRole(m, 'DEV', 'account', 'Owns the ORDERS table but cannot grant here')
  wireContainers(m, true, 'schema:SALES.SECURE', 'SECURE', 'SCHEMA_OWNER')
  addTableLike(m, 'table', 'table:SALES.SECURE.ORDERS', 'ORDERS', 'DEV', 'schema:SALES.SECURE')
  addUser(m, 'so', 'SCHEMA_OWNER')
  addUser(m, 'alice', 'ANALYST')
  addUser(m, 'sec', 'SECURITYADMIN')
  grantRoleToUser(m, 'ANALYST', 'alice')
  return m
}

const level9Exercise: Exercise = {
  id: 'managed-access-grant',
  title: 'Grant inside a managed-access schema',
  brief:
    '`SALES.SECURE` is a **managed-access** schema. `DEV` owns the `ORDERS` table but — because of managed access — cannot grant access to it. You are the **schema owner**. The container privileges are already in place; grant **ANALYST** read access to `ORDERS`.',
  seed: level9Seed,
  actor: 'so',
  setupOps: [
    { op: 'GRANT_PRIV', privilege: 'USAGE', objectId: 'wh:ANALYTICS_WH', toRole: 'ANALYST' },
    { op: 'GRANT_PRIV', privilege: 'USAGE', objectId: 'db:SALES', toRole: 'ANALYST' },
    { op: 'GRANT_PRIV', privilege: 'USAGE', objectId: 'schema:SALES.SECURE', toRole: 'ANALYST' },
  ],
  starterSql: '-- You are the schema owner. Grant ANALYST SELECT on the secure ORDERS table.\n',
  goals: [
    {
      description: 'Alice (ANALYST) can SELECT from SALES.SECURE.ORDERS',
      user: 'alice',
      action: { kind: 'SELECT', objectId: 'table:SALES.SECURE.ORDERS', warehouseId: 'wh:ANALYTICS_WH' },
      expect: 'allow',
    },
  ],
  leastPrivilege: {
    requiredGrants: [{ privilege: 'SELECT', objectId: 'table:SALES.SECURE.ORDERS', grantee: 'ANALYST' }],
    penalizeExtra: true,
  },
  hints: [
    'In a managed-access schema only the schema owner (you) or a MANAGE GRANTS holder can grant — DEV cannot, even as the table owner.',
    'Run: `GRANT SELECT ON TABLE SALES.SECURE.ORDERS TO ROLE ANALYST;`',
  ],
  successMessage: 'Because you own the schema, the grant went through — exactly how managed access centralizes control. 🔐',
}

// ---------- Level 12: refactor to the two-hierarchy pattern ----------
function level12Seed(): AccountModel {
  const m = withSystemRoles(account())
  addRole(m, 'SALES_READ', 'account', 'Access role: read sales data')
  addRole(m, 'ANALYST', 'account', 'Functional role for analysts')
  grantRoleToRole(m, 'ANALYST', 'SYSADMIN')
  wireContainers(m)
  addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
  addUser(m, 'alice', 'ANALYST')
  addUser(m, 'sec', 'SECURITYADMIN')
  grantRoleToUser(m, 'ANALYST', 'alice')
  return m
}

const level12Exercise: Exercise = {
  id: 'two-hierarchy',
  title: 'Build the access-role / functional-role pattern',
  brief:
    'Wire read access using the best-practice pattern: put the object privileges on the **SALES_READ** access role, then compose it into the **ANALYST** functional role (which Alice already holds). Acting as **SECURITYADMIN**, and keep Alice **read-only**.',
  seed: level12Seed,
  actor: 'sec',
  starterSql:
    '-- 1) Give SALES_READ the read access chain (warehouse, database, schema, SELECT on ORDERS).\n-- 2) Compose it into ANALYST.\n',
  goals: [
    {
      description: 'Alice can SELECT from ORDERS',
      user: 'alice',
      action: { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' },
      expect: 'allow',
    },
    {
      description: 'Alice CANNOT INSERT into ORDERS (read-only)',
      user: 'alice',
      action: { kind: 'INSERT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' },
      expect: 'deny',
    },
  ],
  leastPrivilege: {
    requiredGrants: [
      { privilege: 'USAGE', objectId: 'wh:ANALYTICS_WH', grantee: 'SALES_READ' },
      { privilege: 'USAGE', objectId: 'db:SALES', grantee: 'SALES_READ' },
      { privilege: 'USAGE', objectId: 'schema:SALES.PUBLIC', grantee: 'SALES_READ' },
      { privilege: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', grantee: 'SALES_READ' },
    ],
    penalizeExtra: true,
  },
  hints: [
    'Grant USAGE on ANALYTICS_WH, SALES, and SALES.PUBLIC, plus SELECT on ORDERS — all to **SALES_READ** (not ANALYST directly).',
    'Then compose: `GRANT ROLE SALES_READ TO ROLE ANALYST;`',
    'Don’t grant INSERT — Alice must stay read-only.',
  ],
  successMessage: 'Object privileges on the access role, composed into the functional role Alice holds — textbook RBAC design. 📐',
}

export const LEVEL_EXERCISES: Record<number, Exercise> = {
  5: level5Exercise,
  6: level6Exercise,
  8: level8Exercise,
  9: level9Exercise,
  12: level12Exercise,
}
