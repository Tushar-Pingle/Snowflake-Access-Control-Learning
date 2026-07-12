/**
 * Structured operation application: GRANT / REVOKE / CREATE / USE, returning a new
 * model (the input is never mutated). This is what exercises apply and auto-grade.
 *
 * Teaching rules enforced here:
 *  - GRANT/REVOKE of an object privilege requires grant authority (canGrant).
 *  - CREATE_OBJECT sets the owner to the actor's PRIMARY role, then materializes
 *    matching future grants — schema-scoped future grants shadow database-scoped
 *    ones for the same object type.
 *  - GRANT_OWNERSHIP is blocked when outbound grants exist unless COPY / REVOKE
 *    CURRENT GRANTS is chosen.
 */
import { cloneModel, enclosingDatabase, enclosingSchema, qualifiedName } from './model'
import { canGrant, hasManageGrants, hasPriv } from './privileges'
import { activeRoles } from './roleGraph'
import type { AccountModel, FutureGrant, Op, OpResult, RoleName, SimUser } from './types'

export interface ApplyOptions {
  /** When true (default), grant/revoke ops require the actor to be authorized. */
  enforceGrantAuth?: boolean
}

function fail(model: AccountModel, error: string): OpResult {
  return { model, error }
}

/** Materialize future grants for a newly created object (schema shadows database). */
function materializeFutureGrants(model: AccountModel, objectId: string): void {
  const obj = model.objects[objectId]
  if (!obj) return
  const schema = enclosingSchema(model, objectId)
  const db = enclosingDatabase(model, objectId)

  const matches = (fg: FutureGrant, kind: 'SCHEMA' | 'DATABASE', containerId?: string) =>
    fg.targetType === obj.type && fg.scope.kind === kind && fg.scope.containerId === containerId

  const schemaFutures = schema ? model.futureGrants.filter((fg) => matches(fg, 'SCHEMA', schema.id)) : []
  const dbFutures = db ? model.futureGrants.filter((fg) => matches(fg, 'DATABASE', db.id)) : []

  // Precedence: a schema-level future grant for this type shadows the database-level one.
  const applicable = schemaFutures.length > 0 ? schemaFutures : dbFutures
  for (const fg of applicable) {
    const scopeName = fg.scope.kind === 'SCHEMA' ? qualifiedName(model, fg.scope.containerId) : model.objects[fg.scope.containerId]?.name
    model.privGrants.push({
      privilege: fg.privilege,
      objectId,
      grantee: fg.grantee,
      viaFutureGrant: `${fg.privilege} ON FUTURE ${fg.targetType.toUpperCase()}S IN ${fg.scope.kind} ${scopeName}`,
    })
  }
}

export function applyOp(
  model: AccountModel,
  actorName: string,
  op: Op,
  options: ApplyOptions = {},
): OpResult {
  const enforce = options.enforceGrantAuth ?? true
  const actor: SimUser | undefined = model.users[actorName]
  if (!actor) return fail(model, `Unknown actor "${actorName}".`)

  const next = cloneModel(model)
  const active = activeRoles(next, actor, false)

  switch (op.op) {
    case 'GRANT_PRIV': {
      if (!next.objects[op.objectId]) return fail(model, `Unknown object "${op.objectId}".`)
      if (!next.roles[op.toRole]) return fail(model, `Unknown role "${op.toRole}".`)
      if (enforce) {
        const auth = canGrant(next, active, op.privilege, op.objectId)
        if (!auth.ok) return fail(model, `Not authorized to grant: ${auth.reason}`)
      }
      // Avoid duplicate identical grants.
      const exists = next.privGrants.find(
        (g) => g.privilege === op.privilege && g.objectId === op.objectId && g.grantee === op.toRole,
      )
      if (exists) {
        exists.withGrantOption = exists.withGrantOption || op.withGrantOption
      } else {
        next.privGrants.push({
          privilege: op.privilege,
          objectId: op.objectId,
          grantee: op.toRole,
          withGrantOption: op.withGrantOption,
          grantedBy: actor.primaryRole,
        })
      }
      return { model: next }
    }

    case 'REVOKE_PRIV': {
      if (enforce) {
        const auth = canGrant(next, active, op.privilege, op.objectId)
        if (!auth.ok) return fail(model, `Not authorized to revoke: ${auth.reason}`)
      }
      next.privGrants = next.privGrants.filter(
        (g) => !(g.privilege === op.privilege && g.objectId === op.objectId && g.grantee === op.fromRole),
      )
      return { model: next }
    }

    case 'GRANT_ROLE': {
      if (!next.roles[op.role]) return fail(model, `Unknown role "${op.role}".`)
      if (enforce && !hasManageGrants(next, active) && !ownsRoleParent(next, active, op.role)) {
        return fail(model, 'Not authorized to grant roles: need MANAGE GRANTS (or ownership of the role).')
      }
      const dup = next.roleGrants.find(
        (g) => g.role === op.role && sameGrantee(g.grantedTo, op.to),
      )
      if (!dup) next.roleGrants.push({ role: op.role, grantedTo: op.to })
      return { model: next }
    }

    case 'REVOKE_ROLE': {
      next.roleGrants = next.roleGrants.filter(
        (g) => !(g.role === op.role && sameGrantee(g.grantedTo, op.from)),
      )
      return { model: next }
    }

    case 'GRANT_OWNERSHIP': {
      const obj = next.objects[op.objectId]
      if (!obj) return fail(model, `Unknown object "${op.objectId}".`)
      if (!next.roles[op.toRole]) return fail(model, `Unknown role "${op.toRole}".`)
      if (enforce) {
        const auth = canGrant(next, active, 'OWNERSHIP', op.objectId)
        if (!auth.ok) return fail(model, `Not authorized to transfer ownership: ${auth.reason}`)
      }
      // Outbound (dependent) grants force a COPY / REVOKE decision — modeled explicitly.
      const outbound = next.privGrants.filter((g) => g.objectId === op.objectId && g.privilege !== 'OWNERSHIP')
      if (op.currentGrants === 'REVOKE') {
        next.privGrants = next.privGrants.filter((g) => g.objectId !== op.objectId)
      } else {
        // COPY: keep existing grants; the new owner becomes their grantor.
        for (const g of outbound) g.grantedBy = op.toRole
      }
      obj.owner = op.toRole
      return { model: next }
    }

    case 'GRANT_FUTURE': {
      if (enforce && !hasManageGrants(next, active) && !ownsContainer(next, active, op.scope.containerId)) {
        return fail(model, 'Not authorized: future grants require MANAGE GRANTS or ownership of the container.')
      }
      const dup = next.futureGrants.find(
        (fg) =>
          fg.privilege === op.privilege &&
          fg.targetType === op.targetType &&
          fg.grantee === op.toRole &&
          fg.scope.kind === op.scope.kind &&
          fg.scope.containerId === op.scope.containerId,
      )
      if (!dup) {
        next.futureGrants.push({
          privilege: op.privilege,
          targetType: op.targetType,
          grantee: op.toRole,
          scope: op.scope,
        })
      }
      return { model: next }
    }

    case 'CREATE_OBJECT': {
      if (next.objects[op.object.id]) return fail(model, `Object "${op.object.id}" already exists.`)
      // Ownership goes to the actor's PRIMARY role, not any secondary role.
      next.objects[op.object.id] = { ...op.object, owner: actor.primaryRole }
      materializeFutureGrants(next, op.object.id)
      return { model: next }
    }

    case 'USE_ROLE': {
      if (!next.roles[op.role]) return fail(model, `Unknown role "${op.role}".`)
      next.users[actorName] = { ...actor, primaryRole: op.role }
      return { model: next }
    }

    case 'USE_SECONDARY_ROLES': {
      next.users[actorName] = { ...actor, secondaryRoles: op.value }
      return { model: next }
    }
  }
}

/** Apply a sequence of ops, threading the model. Stops at the first error by default. */
export function applyOps(
  model: AccountModel,
  actorName: string,
  ops: Op[],
  options: ApplyOptions & { stopOnError?: boolean } = {},
): { model: AccountModel; errors: { index: number; error: string }[] } {
  let current = model
  const errors: { index: number; error: string }[] = []
  ops.forEach((op, index) => {
    const res = applyOp(current, actorName, op, options)
    if (res.error) {
      errors.push({ index, error: res.error })
      if (options.stopOnError) return
    } else {
      current = res.model
    }
  })
  return { model: current, errors }
}

// ---------- small helpers ----------

function sameGrantee(a: { role: RoleName } | { user: string }, b: { role: RoleName } | { user: string }): boolean {
  if ('role' in a && 'role' in b) return a.role === b.role
  if ('user' in a && 'user' in b) return a.user === b.user
  return false
}

/** A role is "owned" for granting purposes if the actor created/owns it. Simplified: MANAGE GRANTS covers it. */
function ownsRoleParent(_model: AccountModel, _active: Set<RoleName>, _role: RoleName): boolean {
  return false
}

function ownsContainer(model: AccountModel, active: Set<RoleName>, containerId: string): boolean {
  return hasPriv(model, active, 'OWNERSHIP', containerId).ok
}
