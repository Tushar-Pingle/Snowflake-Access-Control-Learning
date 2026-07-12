/**
 * Role-graph resolution.
 *
 * Snowflake roles form a DAG. Holding a role `r` grants you the privileges of
 * every role that has been *granted into* `r` — parents inherit their children's
 * privileges. PUBLIC is auto-granted to every role and user, so it is always active.
 */
import type { AccountModel, RoleName, SimUser, UserName } from './types'

export const PUBLIC_ROLE = 'PUBLIC'

/** Roles granted directly to a user (one hop). */
export function directRolesGrantedToUser(model: AccountModel, user: UserName): RoleName[] {
  return model.roleGrants
    .filter((g) => 'user' in g.grantedTo && g.grantedTo.user === user)
    .map((g) => g.role)
}

/**
 * Cycle-safe closure of a starting role set: the start plus every role reachable
 * by following "child role granted into a role we already hold". PUBLIC is always
 * folded in.
 */
export function roleClosure(model: AccountModel, startRoles: Iterable<RoleName>): Set<RoleName> {
  const result = new Set<RoleName>()
  const stack: RoleName[] = [...startRoles, PUBLIC_ROLE]
  while (stack.length) {
    const r = stack.pop()!
    if (result.has(r)) continue // cycle / diamond guard
    result.add(r)
    for (const edge of model.roleGrants) {
      if ('role' in edge.grantedTo && edge.grantedTo.role === r) {
        stack.push(edge.role) // edge.role (child) is inherited by r
      }
    }
  }
  return result
}

/**
 * The set of roles that authorize an action.
 * - Primary role is always included.
 * - Secondary roles are included for every action EXCEPT CREATE (create + ownership
 *   use the primary role only).
 * The whole set is then expanded through the role DAG.
 */
export function activeRoles(model: AccountModel, user: SimUser, isCreate: boolean): Set<RoleName> {
  const base = new Set<RoleName>([user.primaryRole])
  if (!isCreate) {
    if (user.secondaryRoles === 'ALL') {
      for (const r of directRolesGrantedToUser(model, user.name)) base.add(r)
    } else if (Array.isArray(user.secondaryRoles)) {
      for (const r of user.secondaryRoles) base.add(r)
    }
    // 'NONE' → primary only
  }
  return roleClosure(model, base)
}
