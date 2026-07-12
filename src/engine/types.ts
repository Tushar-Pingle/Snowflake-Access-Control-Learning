/**
 * Core type model for the in-browser Snowflake RBAC simulator.
 *
 * The engine is a small, pure, framework-agnostic model of a Snowflake account.
 * It answers the question "can this user perform this action?" and, crucially,
 * *explains why* by returning the ordered access chain with per-link status.
 *
 * All facts encoded here are verified against Snowflake documentation — see
 * the curriculum content for citations.
 */

// ---------- Identifiers ----------

/** A securable object id, e.g. "table:SALES.PUBLIC.ORDERS" or "wh:ANALYTICS_WH". */
export type ObjectId = string

/** A role name. Account roles are bare ("ANALYST"); database roles are qualified ("SALES.ANALYST_DR"). */
export type RoleName = string

export type UserName = string

export type ObjectType =
  | 'account'
  | 'warehouse'
  | 'database'
  | 'schema'
  | 'table'
  | 'view'
  | 'stage'
  | 'stream'
  | 'task'
  | 'function'

/**
 * Privilege names used by the simulator. This is a curated subset of Snowflake's
 * full catalog — enough to teach every core access-control concept faithfully.
 */
export type Privilege =
  | 'OWNERSHIP'
  | 'USAGE'
  | 'OPERATE'
  | 'MONITOR'
  | 'MODIFY'
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'TRUNCATE'
  | 'REFERENCES'
  | 'READ'
  | 'WRITE'
  | 'CREATE SCHEMA'
  | 'CREATE TABLE'
  | 'CREATE VIEW'
  | 'CREATE STAGE'
  | 'CREATE STREAM'
  | 'CREATE TASK'
  | 'CREATE FUNCTION'
  | 'CREATE DATABASE'
  | 'CREATE ROLE'
  | 'CREATE USER'
  | 'CREATE WAREHOUSE'
  | 'MANAGE GRANTS'
  | 'APPLY MASKING POLICY'
  | 'APPLY ROW ACCESS POLICY'
  | 'APPLY TAG'

// ---------- Securable objects ----------

export interface SecurableObject {
  id: ObjectId
  type: ObjectType
  /** Simple (unqualified) name, e.g. "ORDERS". */
  name: string
  /** Container parent id (schema→db→account). Warehouses have no db/account container in the chain. */
  parentId?: ObjectId
  /** The single owning role (holds OWNERSHIP). */
  owner: RoleName
  /** Schemas only: created WITH MANAGED ACCESS. */
  managedAccess?: boolean
  /** Warehouses only: currently running / resumed. */
  running?: boolean
  /** Warehouses only: AUTO_RESUME enabled. */
  autoResume?: boolean
}

// ---------- Grants ----------

export interface PrivilegeGrant {
  privilege: Privilege
  objectId: ObjectId
  /** The role that holds the privilege. */
  grantee: RoleName
  withGrantOption?: boolean
  /** Where the grant came from — used for audit/explanation text. */
  grantedBy?: RoleName
  /** If this grant was materialized from a future grant, the future-grant description. */
  viaFutureGrant?: string
}

export interface FutureGrant {
  privilege: Privilege
  scope: { kind: 'SCHEMA' | 'DATABASE'; containerId: ObjectId }
  /** Object type the future grant applies to, e.g. 'table'. */
  targetType: ObjectType
  grantee: RoleName
}

/** A role→role or role→user edge. `role` (the child) is inherited by `grantedTo` (the parent). */
export interface RoleGrant {
  role: RoleName
  grantedTo: { role: RoleName } | { user: UserName }
}

export interface Role {
  name: RoleName
  kind: 'system' | 'account' | 'database'
  /** For database roles: the database this role is scoped to. */
  databaseId?: ObjectId
  /** Short human description (used in reference UI). */
  description?: string
}

export type SecondaryRoles = 'ALL' | 'NONE' | RoleName[]

export interface SimUser {
  name: UserName
  /** Current session (primary) role — set by USE ROLE. Ownership + CREATE use this only. */
  primaryRole: RoleName
  /** Secondary roles — USE SECONDARY ROLES ALL | NONE | explicit list. */
  secondaryRoles: SecondaryRoles
  defaultRole?: RoleName
}

/** The whole mini-account. Everything the engine reasons about lives here. */
export interface AccountModel {
  users: Record<UserName, SimUser>
  roles: Record<RoleName, Role>
  objects: Record<ObjectId, SecurableObject>
  roleGrants: RoleGrant[]
  privGrants: PrivilegeGrant[]
  futureGrants: FutureGrant[]
}

// ---------- Actions ----------

export type DmlKind = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE'

export type Action =
  /** Query/DML against a table or view, run on a warehouse. */
  | { kind: DmlKind; objectId: ObjectId; warehouseId?: ObjectId }
  /** CREATE a new object of `objectType` inside a container — evaluated against the PRIMARY role only. */
  | { kind: 'CREATE'; objectType: ObjectType; containerId: ObjectId }
  /** Whether the actor may grant `privilege` on `objectId`. */
  | { kind: 'GRANT'; privilege: Privilege; objectId: ObjectId }
  /** USAGE-style check (e.g. resume warehouse via OPERATE). */
  | { kind: 'OPERATE'; objectId: ObjectId }

// ---------- Explanation output (drives the green/red visual) ----------

export interface AccessLink {
  /** Human label, e.g. "USAGE on database SALES". */
  label: string
  ok: boolean
  /** Optional detail shown under the label. */
  detail?: string
  /** How the requirement was satisfied (grantee role + privilege), when ok. */
  via?: string
  /** Suggested remediation SQL/text when not ok. */
  fix?: string
}

export interface AccessExplanation {
  allowed: boolean
  links: AccessLink[]
  /** Flattened set of active roles considered for this action. */
  activeRoles: RoleName[]
  /** Short summary sentence. */
  summary: string
}

// ---------- Structured operations (GRANT/REVOKE/CREATE/USE) ----------

export type Op =
  | { op: 'GRANT_PRIV'; privilege: Privilege; objectId: ObjectId; toRole: RoleName; withGrantOption?: boolean }
  | { op: 'REVOKE_PRIV'; privilege: Privilege; objectId: ObjectId; fromRole: RoleName }
  | { op: 'GRANT_ROLE'; role: RoleName; to: { role: RoleName } | { user: UserName } }
  | { op: 'REVOKE_ROLE'; role: RoleName; from: { role: RoleName } | { user: UserName } }
  | { op: 'GRANT_OWNERSHIP'; objectId: ObjectId; toRole: RoleName; currentGrants: 'COPY' | 'REVOKE' }
  | {
      op: 'GRANT_FUTURE'
      privilege: Privilege
      scope: { kind: 'SCHEMA' | 'DATABASE'; containerId: ObjectId }
      targetType: ObjectType
      toRole: RoleName
    }
  | { op: 'CREATE_OBJECT'; object: SecurableObject }
  | { op: 'USE_ROLE'; role: RoleName }
  | { op: 'USE_SECONDARY_ROLES'; value: 'ALL' | 'NONE' }

export interface OpResult {
  model: AccountModel
  /** Populated when the op was rejected; the model is returned unchanged. */
  error?: string
}
