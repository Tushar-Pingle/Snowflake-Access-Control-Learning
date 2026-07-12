/**
 * Small, chainable helpers to construct {@link AccountModel} instances for
 * exercises, the sandbox, and tests. Every helper mutates and returns the model.
 */
import type {
  AccountModel,
  ObjectType,
  Privilege,
  Role,
  RoleName,
  SecondaryRoles,
  SecurableObject,
  UserName,
} from './types'

export function account(): AccountModel {
  return { users: {}, roles: {}, objects: {}, roleGrants: [], privGrants: [], futureGrants: [] }
}

export function addRole(
  m: AccountModel,
  name: RoleName,
  kind: Role['kind'] = 'account',
  description?: string,
  databaseId?: string,
): AccountModel {
  m.roles[name] = { name, kind, description, databaseId }
  return m
}

export function addUser(
  m: AccountModel,
  name: UserName,
  primaryRole: RoleName,
  secondaryRoles: SecondaryRoles = 'NONE',
): AccountModel {
  m.users[name] = { name, primaryRole, secondaryRoles }
  return m
}

export function addObject(m: AccountModel, obj: SecurableObject): AccountModel {
  m.objects[obj.id] = obj
  return m
}

export function addWarehouse(
  m: AccountModel,
  id: string,
  name: string,
  owner: RoleName,
  opts: { running?: boolean; autoResume?: boolean } = {},
): AccountModel {
  return addObject(m, { id, type: 'warehouse', name, owner, running: opts.running, autoResume: opts.autoResume })
}

export function addDatabase(m: AccountModel, id: string, name: string, owner: RoleName, parentId?: string): AccountModel {
  return addObject(m, { id, type: 'database', name, owner, parentId })
}

export function addSchema(
  m: AccountModel,
  id: string,
  name: string,
  owner: RoleName,
  parentId: string,
  managedAccess = false,
): AccountModel {
  return addObject(m, { id, type: 'schema', name, owner, parentId, managedAccess })
}

export function addTableLike(
  m: AccountModel,
  type: ObjectType,
  id: string,
  name: string,
  owner: RoleName,
  parentId: string,
): AccountModel {
  return addObject(m, { id, type, name, owner, parentId })
}

export function grantPriv(
  m: AccountModel,
  privilege: Privilege,
  objectId: string,
  grantee: RoleName,
  withGrantOption = false,
): AccountModel {
  m.privGrants.push({ privilege, objectId, grantee, withGrantOption })
  return m
}

export function grantRoleToRole(m: AccountModel, role: RoleName, parent: RoleName): AccountModel {
  m.roleGrants.push({ role, grantedTo: { role: parent } })
  return m
}

export function grantRoleToUser(m: AccountModel, role: RoleName, user: UserName): AccountModel {
  m.roleGrants.push({ role, grantedTo: { user } })
  return m
}

export function grantFuture(
  m: AccountModel,
  privilege: Privilege,
  targetType: ObjectType,
  scope: { kind: 'SCHEMA' | 'DATABASE'; containerId: string },
  grantee: RoleName,
): AccountModel {
  m.futureGrants.push({ privilege, targetType, scope, grantee })
  return m
}

/**
 * Register the six system-defined roles with Snowflake's verified default hierarchy:
 *   SYSADMIN → ACCOUNTADMIN, SECURITYADMIN → ACCOUNTADMIN, USERADMIN → SECURITYADMIN,
 *   PUBLIC → (everything, handled by roleClosure), ORGADMIN → standalone.
 * Also grants global MANAGE GRANTS to SECURITYADMIN and common CREATE privileges.
 */
export function withSystemRoles(m: AccountModel, accountId = 'account:FROSTBYTE'): AccountModel {
  addObject(m, { id: accountId, type: 'account', name: 'FROSTBYTE', owner: 'ACCOUNTADMIN' })
  addRole(m, 'ORGADMIN', 'system', 'Organization-level administration (accounts, org usage). Standalone.')
  addRole(m, 'ACCOUNTADMIN', 'system', 'Top of the account hierarchy. Billing and account parameters. Use sparingly.')
  addRole(m, 'SECURITYADMIN', 'system', 'Manages grants account-wide (holds MANAGE GRANTS). Inherits USERADMIN.')
  addRole(m, 'USERADMIN', 'system', 'Creates and manages users and roles.')
  addRole(m, 'SYSADMIN', 'system', 'Creates warehouses, databases and objects. Parent of all custom roles.')
  addRole(m, 'PUBLIC', 'system', 'Pseudo-role automatically granted to every user and role.')

  grantRoleToRole(m, 'SYSADMIN', 'ACCOUNTADMIN')
  grantRoleToRole(m, 'SECURITYADMIN', 'ACCOUNTADMIN')
  grantRoleToRole(m, 'USERADMIN', 'SECURITYADMIN')

  grantPriv(m, 'MANAGE GRANTS', accountId, 'SECURITYADMIN')
  grantPriv(m, 'CREATE ROLE', accountId, 'USERADMIN')
  grantPriv(m, 'CREATE USER', accountId, 'USERADMIN')
  grantPriv(m, 'CREATE DATABASE', accountId, 'SYSADMIN')
  grantPriv(m, 'CREATE WAREHOUSE', accountId, 'SYSADMIN')
  return m
}
