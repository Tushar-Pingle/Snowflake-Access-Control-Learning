/** Reusable seed models for the free-play sandbox and level exercises. */
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

/**
 * The Frostbyte Inc. world: system roles, an analytics warehouse, a SALES database
 * with PUBLIC + RAW schemas and a couple of tables, plus a few roles and users.
 * SECURITYADMIN-based actor `sec` can grant anything (MANAGE GRANTS).
 */
export function frostbyteBase(): AccountModel {
  const m = withSystemRoles(account())

  addRole(m, 'ANALYST', 'account', 'Reads curated sales data')
  addRole(m, 'DATA_ENGINEER', 'account', 'Builds and loads tables')
  grantRoleToRole(m, 'ANALYST', 'SYSADMIN')
  grantRoleToRole(m, 'DATA_ENGINEER', 'SYSADMIN')

  addWarehouse(m, 'wh:ANALYTICS_WH', 'ANALYTICS_WH', 'SYSADMIN', { running: true, autoResume: true })
  addWarehouse(m, 'wh:LOAD_WH', 'LOAD_WH', 'SYSADMIN', { running: false, autoResume: false })

  addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
  addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
  addSchema(m, 'schema:SALES.RAW', 'RAW', 'SYSADMIN', 'db:SALES')
  addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
  addTableLike(m, 'table', 'table:SALES.PUBLIC.CUSTOMERS', 'CUSTOMERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
  addTableLike(m, 'table', 'table:SALES.RAW.EVENTS', 'EVENTS', 'DATA_ENGINEER', 'schema:SALES.RAW')

  addUser(m, 'alice', 'ANALYST')
  addUser(m, 'erik', 'DATA_ENGINEER')
  addUser(m, 'sec', 'SECURITYADMIN')
  addUser(m, 'sys', 'SYSADMIN')
  grantRoleToUser(m, 'ANALYST', 'alice')
  grantRoleToUser(m, 'DATA_ENGINEER', 'erik')

  return m
}

/** A minimal seed: system roles, one warehouse/db/schema/table, an ANALYST role + alice, and `sec` actor. */
export function selectChainSeed(): AccountModel {
  const m = withSystemRoles(account())
  addRole(m, 'ANALYST', 'account')
  grantRoleToRole(m, 'ANALYST', 'SYSADMIN')
  addWarehouse(m, 'wh:ANALYTICS_WH', 'ANALYTICS_WH', 'SYSADMIN', { running: true, autoResume: true })
  addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
  addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
  addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
  addUser(m, 'alice', 'ANALYST')
  grantRoleToUser(m, 'ANALYST', 'alice')
  addUser(m, 'sec', 'SECURITYADMIN')
  return m
}

/** Convenience: give a role the full container USAGE chain (warehouse/db/schema), leaving the object privilege for the learner. */
export function grantUsageChain(m: AccountModel, role: string): AccountModel {
  grantPriv(m, 'USAGE', 'wh:ANALYTICS_WH', role)
  grantPriv(m, 'USAGE', 'db:SALES', role)
  grantPriv(m, 'USAGE', 'schema:SALES.PUBLIC', role)
  return m
}
