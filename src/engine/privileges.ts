/**
 * Privilege evaluation: does a set of active roles hold a privilege on an object,
 * and is a role authorized to *grant* a privilege on an object?
 *
 * Grant-authorization has three independent paths (all verified against Snowflake docs):
 *   1. OWNERSHIP of the object — unless it lives in a managed-access schema.
 *   2. The global MANAGE GRANTS privilege.
 *   3. Holding the privilege WITH GRANT OPTION.
 * In a managed-access schema, only the schema owner or a MANAGE GRANTS holder may grant.
 */
import { enclosingSchema } from './model'
import type { AccountModel, ObjectId, PrivilegeGrant, Privilege, RoleName } from './types'

export interface PrivCheck {
  ok: boolean
  /** The grant that satisfied the check, if any. */
  via?: PrivilegeGrant
}

function ownershipGrantFor(objectId: ObjectId, owner: RoleName): PrivilegeGrant {
  return { privilege: 'OWNERSHIP', objectId, grantee: owner }
}

/**
 * True if any active role holds `privilege` on `objectId`, or owns it
 * (ownership implies all object-level rights). Ownership is read from the
 * object's `owner` field — the single source of truth.
 */
export function hasPriv(
  model: AccountModel,
  activeRoles: Set<RoleName>,
  privilege: Privilege,
  objectId: ObjectId,
): PrivCheck {
  const obj = model.objects[objectId]
  const ownedByActive = !!obj && activeRoles.has(obj.owner)

  if (privilege === 'OWNERSHIP') {
    return ownedByActive ? { ok: true, via: ownershipGrantFor(objectId, obj!.owner) } : { ok: false }
  }

  for (const g of model.privGrants) {
    if (g.objectId !== objectId || !activeRoles.has(g.grantee)) continue
    if (g.privilege === privilege) return { ok: true, via: g }
  }

  // Ownership implies every object-level privilege.
  if (ownedByActive) return { ok: true, via: ownershipGrantFor(objectId, obj!.owner) }
  return { ok: false }
}

/** Global MANAGE GRANTS — held on the account object. */
export function hasManageGrants(model: AccountModel, activeRoles: Set<RoleName>): boolean {
  return model.privGrants.some(
    (g) => g.privilege === 'MANAGE GRANTS' && activeRoles.has(g.grantee),
  )
}

/** True if an active role holds the given privilege on the object WITH GRANT OPTION. */
export function holdsWithGrantOption(
  model: AccountModel,
  activeRoles: Set<RoleName>,
  privilege: Privilege,
  objectId: ObjectId,
): boolean {
  return model.privGrants.some(
    (g) =>
      g.objectId === objectId &&
      g.privilege === privilege &&
      g.withGrantOption === true &&
      activeRoles.has(g.grantee),
  )
}

export interface GrantAuth {
  ok: boolean
  reason: string
}

/**
 * Whether the active role set may GRANT `privilege` on `objectId`.
 * Encodes the managed-access rule plus the three delegation paths.
 */
export function canGrant(
  model: AccountModel,
  activeRoles: Set<RoleName>,
  privilege: Privilege,
  objectId: ObjectId,
): GrantAuth {
  const schema = enclosingSchema(model, objectId)
  const ownsObject = hasPriv(model, activeRoles, 'OWNERSHIP', objectId).ok

  if (schema?.managedAccess) {
    // In a managed-access schema, object owners lose grant authority.
    if (hasPriv(model, activeRoles, 'OWNERSHIP', schema.id).ok) {
      return { ok: true, reason: 'Authorized as the schema owner (managed access).' }
    }
    if (hasManageGrants(model, activeRoles)) {
      return { ok: true, reason: 'Authorized via MANAGE GRANTS.' }
    }
    return {
      ok: false,
      reason: 'Managed-access schema: only the schema owner or a MANAGE GRANTS holder may grant.',
    }
  }

  if (ownsObject) return { ok: true, reason: 'Authorized as the object owner (OWNERSHIP).' }
  if (hasManageGrants(model, activeRoles)) return { ok: true, reason: 'Authorized via MANAGE GRANTS.' }
  if (holdsWithGrantOption(model, activeRoles, privilege, objectId)) {
    return { ok: true, reason: 'Authorized via WITH GRANT OPTION on this privilege.' }
  }
  return {
    ok: false,
    reason: 'Need OWNERSHIP of the object, the MANAGE GRANTS privilege, or the privilege WITH GRANT OPTION.',
  }
}
