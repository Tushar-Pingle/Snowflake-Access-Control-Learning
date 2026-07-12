/**
 * The flagship evaluator. Given a user and an action, returns the ordered access
 * chain with per-link satisfied/unsatisfied status — this drives the green/red
 * visual and the graduated hints in exercises.
 */
import { enclosingDatabase, enclosingSchema, getObject, qualifiedName } from './model'
import { canGrant, hasPriv } from './privileges'
import { activeRoles } from './roleGraph'
import type {
  AccessExplanation,
  AccessLink,
  AccountModel,
  Action,
  Privilege,
  PrivilegeGrant,
  RoleName,
  SimUser,
} from './types'

function viaText(g: PrivilegeGrant | undefined): string | undefined {
  if (!g) return undefined
  const base = `${g.privilege} held by role ${g.grantee}`
  return g.viaFutureGrant ? `${base} (via future grant: ${g.viaFutureGrant})` : base
}

function privLink(
  model: AccountModel,
  active: Set<RoleName>,
  privilege: Privilege,
  objectId: string,
  label: string,
  fix: string,
): AccessLink {
  const check = hasPriv(model, active, privilege, objectId)
  return {
    label,
    ok: check.ok,
    via: check.ok ? viaText(check.via) : undefined,
    fix: check.ok ? undefined : fix,
  }
}

export function explainAccess(model: AccountModel, user: SimUser, action: Action): AccessExplanation {
  const isCreate = action.kind === 'CREATE'
  const active = activeRoles(model, user, isCreate)
  const links: AccessLink[] = []

  if (
    action.kind === 'SELECT' ||
    action.kind === 'INSERT' ||
    action.kind === 'UPDATE' ||
    action.kind === 'DELETE' ||
    action.kind === 'TRUNCATE'
  ) {
    const obj = getObject(model, action.objectId)
    const schema = enclosingSchema(model, action.objectId)
    const db = enclosingDatabase(model, action.objectId)
    const objName = obj ? qualifiedName(model, obj.id) : action.objectId

    // 1 + 1b) Warehouse USAGE and running state.
    if (action.warehouseId) {
      const wh = getObject(model, action.warehouseId)
      const whName = wh?.name ?? action.warehouseId
      links.push(
        privLink(
          model,
          active,
          'USAGE',
          action.warehouseId,
          `USAGE on warehouse ${whName}`,
          `GRANT USAGE ON WAREHOUSE ${whName} TO ROLE <role>;`,
        ),
      )
      const canOperate = hasPriv(model, active, 'OPERATE', action.warehouseId).ok
      const running = !!wh?.running || !!wh?.autoResume || canOperate
      links.push({
        label: `Warehouse ${whName} is running`,
        ok: running,
        detail: wh?.running
          ? 'The warehouse is currently running.'
          : wh?.autoResume
            ? 'AUTO_RESUME will start the warehouse on demand.'
            : canOperate
              ? 'You hold OPERATE and can resume it.'
              : undefined,
        fix: running
          ? undefined
          : `Resume ${whName}, enable AUTO_RESUME, or GRANT OPERATE ON WAREHOUSE ${whName} TO ROLE <role>;`,
      })
    }

    // 2) Database USAGE.
    if (db) {
      links.push(
        privLink(
          model,
          active,
          'USAGE',
          db.id,
          `USAGE on database ${db.name}`,
          `GRANT USAGE ON DATABASE ${db.name} TO ROLE <role>;`,
        ),
      )
    }

    // 3) Schema USAGE.
    if (schema) {
      links.push(
        privLink(
          model,
          active,
          'USAGE',
          schema.id,
          `USAGE on schema ${db ? db.name + '.' : ''}${schema.name}`,
          `GRANT USAGE ON SCHEMA ${qualifiedName(model, schema.id)} TO ROLE <role>;`,
        ),
      )
    }

    // 4) Object privilege (or OWNERSHIP).
    links.push(
      privLink(
        model,
        active,
        action.kind,
        action.objectId,
        `${action.kind} on ${obj?.type ?? 'object'} ${objName}`,
        `GRANT ${action.kind} ON ${(obj?.type ?? 'TABLE').toUpperCase()} ${objName} TO ROLE <role>;`,
      ),
    )
  } else if (action.kind === 'CREATE') {
    const container = getObject(model, action.containerId)
    const db = enclosingDatabase(model, action.containerId)
    const createPriv = `CREATE ${action.objectType.toUpperCase()}` as Privilege

    if (db && container?.type === 'schema') {
      links.push(
        privLink(model, active, 'USAGE', db.id, `USAGE on database ${db.name}`, `GRANT USAGE ON DATABASE ${db.name} TO ROLE <role>;`),
      )
    }
    if (container) {
      const containerName = qualifiedName(model, container.id)
      const isSchemaTarget = container.type === 'schema'
      // Creating an object in a schema needs USAGE on that schema; creating a schema needs USAGE on its db (above).
      if (isSchemaTarget) {
        links.push(
          privLink(model, active, 'USAGE', container.id, `USAGE on schema ${containerName}`, `GRANT USAGE ON SCHEMA ${containerName} TO ROLE <role>;`),
        )
      }
      links.push(
        privLink(
          model,
          active,
          createPriv,
          container.id,
          `${createPriv} on ${container.type} ${containerName}`,
          `GRANT ${createPriv} ON ${container.type.toUpperCase()} ${containerName} TO ROLE <role>;`,
        ),
      )
    }

    links.push({
      label: 'Evaluated against the PRIMARY role only',
      ok: true,
      detail: `CREATE and object ownership use the current (primary) role: ${user.primaryRole}. Secondary roles cannot create objects.`,
    })
  } else if (action.kind === 'GRANT') {
    const obj = getObject(model, action.objectId)
    const objName = obj ? qualifiedName(model, obj.id) : action.objectId
    const auth = canGrant(model, active, action.privilege, action.objectId)
    links.push({
      label: `Authorized to GRANT ${action.privilege} on ${objName}`,
      ok: auth.ok,
      detail: auth.reason,
      fix: auth.ok ? undefined : 'Use a role with OWNERSHIP, MANAGE GRANTS, or the privilege WITH GRANT OPTION.',
    })
  } else if (action.kind === 'OPERATE') {
    const wh = getObject(model, action.objectId)
    const whName = wh?.name ?? action.objectId
    links.push(
      privLink(model, active, 'OPERATE', action.objectId, `OPERATE on warehouse ${whName}`, `GRANT OPERATE ON WAREHOUSE ${whName} TO ROLE <role>;`),
    )
  }

  const allowed = links.every((l) => l.ok)
  const okCount = links.filter((l) => l.ok).length
  const summary = allowed
    ? 'Access granted — every required link in the chain is satisfied.'
    : `Access denied — ${okCount} of ${links.length} required links are satisfied.`

  return { allowed, links, activeRoles: [...active].sort(), summary }
}
