import { describe, it, expect } from 'vitest'
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
  grantFuture,
  withSystemRoles,
} from './builder'
import { roleClosure, PUBLIC_ROLE } from './roleGraph'
import { canGrant, holdsWithGrantOption } from './privileges'
import { explainAccess } from './explainAccess'
import { applyOp, applyOps } from './apply'
import { parseSql } from './sql'
import { gradeExercise, type LeastPrivilegeRef } from './grader'
import type { AccountModel } from './types'

/** A small Frostbyte account with the standard SELECT access chain wired up (but not yet granted to ANALYST). */
function baseScenario(): AccountModel {
  const m = withSystemRoles(account())
  addRole(m, 'ANALYST', 'account', 'Business analyst persona')
  addUser(m, 'alice', 'ANALYST')
  addWarehouse(m, 'wh:ANALYTICS_WH', 'ANALYTICS_WH', 'SYSADMIN', { running: true })
  addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
  addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
  addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
  return m
}

function grantFullChain(m: AccountModel, role = 'ANALYST') {
  grantPriv(m, 'USAGE', 'wh:ANALYTICS_WH', role)
  grantPriv(m, 'USAGE', 'db:SALES', role)
  grantPriv(m, 'USAGE', 'schema:SALES.PUBLIC', role)
  grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.ORDERS', role)
  return m
}

describe('role graph — closure & inheritance', () => {
  it('always includes PUBLIC', () => {
    const m = account()
    addRole(m, 'X')
    expect(roleClosure(m, ['X']).has(PUBLIC_ROLE)).toBe(true)
  })

  it('parents inherit privileges of child roles granted into them', () => {
    const m = account()
    addRole(m, 'CHILD')
    addRole(m, 'PARENT')
    grantRoleToRole(m, 'CHILD', 'PARENT') // CHILD granted INTO PARENT
    const closure = roleClosure(m, ['PARENT'])
    expect(closure.has('CHILD')).toBe(true)
    expect(closure.has('PARENT')).toBe(true)
  })

  it('is cycle-safe (A→B, B→A terminates)', () => {
    const m = account()
    addRole(m, 'A')
    addRole(m, 'B')
    grantRoleToRole(m, 'A', 'B')
    grantRoleToRole(m, 'B', 'A')
    const closure = roleClosure(m, ['A'])
    expect(closure.has('A')).toBe(true)
    expect(closure.has('B')).toBe(true)
  })

  it('dedupes diamonds', () => {
    const m = account()
    ;['A', 'B', 'C', 'D'].forEach((r) => addRole(m, r))
    grantRoleToRole(m, 'B', 'A')
    grantRoleToRole(m, 'C', 'A')
    grantRoleToRole(m, 'D', 'B')
    grantRoleToRole(m, 'D', 'C')
    const closure = roleClosure(m, ['A'])
    expect([...closure].filter((r) => r === 'D')).toHaveLength(1)
  })

  it('ACCOUNTADMIN inherits SYSADMIN and SECURITYADMIN by default', () => {
    const m = withSystemRoles(account())
    const closure = roleClosure(m, ['ACCOUNTADMIN'])
    expect(closure.has('SYSADMIN')).toBe(true)
    expect(closure.has('SECURITYADMIN')).toBe(true)
    expect(closure.has('USERADMIN')).toBe(true) // via SECURITYADMIN
  })

  it('ORGADMIN is standalone — not inherited by ACCOUNTADMIN', () => {
    const m = withSystemRoles(account())
    expect(roleClosure(m, ['ACCOUNTADMIN']).has('ORGADMIN')).toBe(false)
  })
})

describe('the SELECT access chain', () => {
  it('denies until every link is satisfied, then allows', () => {
    const m = baseScenario()
    const before = explainAccess(m, m.users.alice, {
      kind: 'SELECT',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      warehouseId: 'wh:ANALYTICS_WH',
    })
    expect(before.allowed).toBe(false)
    // warehouse USAGE, warehouse running, db USAGE, schema USAGE, SELECT = 5 links
    expect(before.links).toHaveLength(5)
    expect(before.links.filter((l) => l.ok).map((l) => l.label)).toContain('Warehouse ANALYTICS_WH is running')

    grantFullChain(m)
    const after = explainAccess(m, m.users.alice, {
      kind: 'SELECT',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      warehouseId: 'wh:ANALYTICS_WH',
    })
    expect(after.allowed).toBe(true)
  })

  it('fails when the warehouse is suspended with no auto-resume and no OPERATE', () => {
    const m = baseScenario()
    grantFullChain(m)
    m.objects['wh:ANALYTICS_WH'].running = false
    m.objects['wh:ANALYTICS_WH'].autoResume = false
    const exp = explainAccess(m, m.users.alice, {
      kind: 'SELECT',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      warehouseId: 'wh:ANALYTICS_WH',
    })
    expect(exp.allowed).toBe(false)
    const runningLink = exp.links.find((l) => l.label.includes('is running'))
    expect(runningLink?.ok).toBe(false)
  })

  it('OPERATE lets a role resume a suspended warehouse', () => {
    const m = baseScenario()
    grantFullChain(m)
    m.objects['wh:ANALYTICS_WH'].running = false
    m.objects['wh:ANALYTICS_WH'].autoResume = false
    grantPriv(m, 'OPERATE', 'wh:ANALYTICS_WH', 'ANALYST')
    const exp = explainAccess(m, m.users.alice, {
      kind: 'SELECT',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      warehouseId: 'wh:ANALYTICS_WH',
    })
    expect(exp.allowed).toBe(true)
  })

  it('ownership of the table implies SELECT but still requires container USAGE', () => {
    const m = baseScenario()
    // Make ANALYST the table owner but grant nothing else.
    m.objects['table:SALES.PUBLIC.ORDERS'].owner = 'ANALYST'
    grantPriv(m, 'USAGE', 'wh:ANALYTICS_WH', 'ANALYST')
    const partial = explainAccess(m, m.users.alice, {
      kind: 'SELECT',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      warehouseId: 'wh:ANALYTICS_WH',
    })
    // SELECT link satisfied by ownership, but db/schema USAGE still missing.
    expect(partial.links.find((l) => l.label.startsWith('SELECT'))?.ok).toBe(true)
    expect(partial.allowed).toBe(false)
    grantPriv(m, 'USAGE', 'db:SALES', 'ANALYST')
    grantPriv(m, 'USAGE', 'schema:SALES.PUBLIC', 'ANALYST')
    expect(
      explainAccess(m, m.users.alice, {
        kind: 'SELECT',
        objectId: 'table:SALES.PUBLIC.ORDERS',
        warehouseId: 'wh:ANALYTICS_WH',
      }).allowed,
    ).toBe(true)
  })

  it('access flows to a parent role through inheritance', () => {
    const m = baseScenario()
    grantFullChain(m) // ANALYST fully wired
    addRole(m, 'DATA_LEAD')
    grantRoleToRole(m, 'ANALYST', 'DATA_LEAD') // ANALYST granted INTO DATA_LEAD
    addUser(m, 'lena', 'DATA_LEAD')
    expect(
      explainAccess(m, m.users.lena, {
        kind: 'SELECT',
        objectId: 'table:SALES.PUBLIC.ORDERS',
        warehouseId: 'wh:ANALYTICS_WH',
      }).allowed,
    ).toBe(true)
  })
})

describe('primary vs secondary roles', () => {
  it('non-CREATE actions honor secondary roles; CREATE uses the primary role only', () => {
    const m = withSystemRoles(account())
    addRole(m, 'DEV')
    addRole(m, 'BUILDER')
    addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
    addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
    addWarehouse(m, 'wh:WH', 'WH', 'SYSADMIN', { running: true })
    addTableLike(m, 'table', 'table:SALES.PUBLIC.T', 'T', 'SYSADMIN', 'schema:SALES.PUBLIC')
    // Both roles can traverse containers.
    for (const r of ['DEV', 'BUILDER']) {
      grantPriv(m, 'USAGE', 'wh:WH', r)
      grantPriv(m, 'USAGE', 'db:SALES', r)
      grantPriv(m, 'USAGE', 'schema:SALES.PUBLIC', r)
    }
    grantPriv(m, 'CREATE TABLE', 'schema:SALES.PUBLIC', 'BUILDER')
    grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.T', 'BUILDER')
    addUser(m, 'bob', 'DEV', 'ALL')
    grantRoleToUser(m, 'BUILDER', 'bob')

    // SELECT via secondary BUILDER → allowed
    expect(
      explainAccess(m, m.users.bob, { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.T', warehouseId: 'wh:WH' })
        .allowed,
    ).toBe(true)

    // CREATE evaluated against primary DEV only → BUILDER's CREATE TABLE does not count
    const create = explainAccess(m, m.users.bob, { kind: 'CREATE', objectType: 'table', containerId: 'schema:SALES.PUBLIC' })
    expect(create.allowed).toBe(false)

    // Switch primary to BUILDER → CREATE allowed
    const used = applyOp(m, 'bob', { op: 'USE_ROLE', role: 'BUILDER' })
    expect(used.error).toBeUndefined()
    expect(
      explainAccess(used.model, used.model.users.bob, { kind: 'CREATE', objectType: 'table', containerId: 'schema:SALES.PUBLIC' })
        .allowed,
    ).toBe(true)
  })
})

describe('grant authorization — ownership, MANAGE GRANTS, WITH GRANT OPTION, managed access', () => {
  it('the object owner may grant in a normal schema', () => {
    const m = baseScenario()
    m.objects['table:SALES.PUBLIC.ORDERS'].owner = 'ANALYST'
    const active = roleClosure(m, ['ANALYST'])
    expect(canGrant(m, active, 'SELECT', 'table:SALES.PUBLIC.ORDERS').ok).toBe(true)
  })

  it('WITH GRANT OPTION lets a non-owner re-grant exactly that privilege', () => {
    const m = baseScenario()
    grantPriv(m, 'SELECT', 'table:SALES.PUBLIC.ORDERS', 'ANALYST', true)
    const active = roleClosure(m, ['ANALYST'])
    expect(holdsWithGrantOption(m, active, 'SELECT', 'table:SALES.PUBLIC.ORDERS')).toBe(true)
    expect(canGrant(m, active, 'SELECT', 'table:SALES.PUBLIC.ORDERS').ok).toBe(true)
    // but not a different privilege
    expect(canGrant(m, active, 'INSERT', 'table:SALES.PUBLIC.ORDERS').ok).toBe(false)
  })

  it('managed access removes the object owner’s grant authority', () => {
    const m = baseScenario()
    addRole(m, 'DEV')
    m.objects['schema:SALES.PUBLIC'].managedAccess = true
    m.objects['schema:SALES.PUBLIC'].owner = 'SYSADMIN'
    m.objects['table:SALES.PUBLIC.ORDERS'].owner = 'DEV'
    const devActive = roleClosure(m, ['DEV'])
    // DEV owns the table but cannot grant in a managed schema
    expect(canGrant(m, devActive, 'SELECT', 'table:SALES.PUBLIC.ORDERS').ok).toBe(false)
    // The schema owner can
    expect(canGrant(m, roleClosure(m, ['SYSADMIN']), 'SELECT', 'table:SALES.PUBLIC.ORDERS').ok).toBe(true)
    // A MANAGE GRANTS holder can
    expect(canGrant(m, roleClosure(m, ['SECURITYADMIN']), 'SELECT', 'table:SALES.PUBLIC.ORDERS').ok).toBe(true)
  })

  it('applyOp rejects an unauthorized GRANT and accepts an authorized one', () => {
    const m = baseScenario()
    addRole(m, 'DEV')
    addUser(m, 'dana', 'DEV')
    // DEV cannot grant SELECT (owns nothing, no MANAGE GRANTS)
    const rejected = applyOp(m, 'dana', {
      op: 'GRANT_PRIV',
      privilege: 'SELECT',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      toRole: 'ANALYST',
    })
    expect(rejected.error).toBeDefined()

    // SECURITYADMIN can
    addUser(m, 'sec', 'SECURITYADMIN')
    const ok = applyOp(m, 'sec', {
      op: 'GRANT_PRIV',
      privilege: 'SELECT',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      toRole: 'ANALYST',
    })
    expect(ok.error).toBeUndefined()
    expect(ok.model.privGrants.some((g) => g.privilege === 'SELECT' && g.grantee === 'ANALYST')).toBe(true)
  })
})

describe('future grants & precedence', () => {
  it('materializes future grants on object creation', () => {
    const m = baseScenario()
    addUser(m, 'sys', 'SYSADMIN')
    grantFuture(m, 'SELECT', 'table', { kind: 'SCHEMA', containerId: 'schema:SALES.PUBLIC' }, 'ANALYST')
    const res = applyOp(m, 'sys', {
      op: 'CREATE_OBJECT',
      object: { id: 'table:SALES.PUBLIC.NEW', type: 'table', name: 'NEW', parentId: 'schema:SALES.PUBLIC', owner: 'PUBLIC' },
    })
    expect(res.error).toBeUndefined()
    expect(
      res.model.privGrants.some((g) => g.objectId === 'table:SALES.PUBLIC.NEW' && g.privilege === 'SELECT' && g.grantee === 'ANALYST'),
    ).toBe(true)
    // owner should be the actor's primary role, not PUBLIC
    expect(res.model.objects['table:SALES.PUBLIC.NEW'].owner).toBe('SYSADMIN')
  })

  it('schema-level future grants shadow database-level ones', () => {
    const m = baseScenario()
    addRole(m, 'REPORTER')
    addUser(m, 'sys', 'SYSADMIN')
    addSchema(m, 'schema:SALES.OTHER', 'OTHER', 'SYSADMIN', 'db:SALES')
    grantFuture(m, 'SELECT', 'table', { kind: 'SCHEMA', containerId: 'schema:SALES.PUBLIC' }, 'ANALYST')
    grantFuture(m, 'SELECT', 'table', { kind: 'DATABASE', containerId: 'db:SALES' }, 'REPORTER')

    // Create in PUBLIC (has its own schema future grant) → only ANALYST applies
    const r1 = applyOp(m, 'sys', {
      op: 'CREATE_OBJECT',
      object: { id: 'table:SALES.PUBLIC.A', type: 'table', name: 'A', parentId: 'schema:SALES.PUBLIC', owner: 'PUBLIC' },
    }).model
    const grantsA = r1.privGrants.filter((g) => g.objectId === 'table:SALES.PUBLIC.A')
    expect(grantsA.some((g) => g.grantee === 'ANALYST')).toBe(true)
    expect(grantsA.some((g) => g.grantee === 'REPORTER')).toBe(false)

    // Create in OTHER (no schema future grant) → database-level REPORTER applies
    const r2 = applyOp(m, 'sys', {
      op: 'CREATE_OBJECT',
      object: { id: 'table:SALES.OTHER.B', type: 'table', name: 'B', parentId: 'schema:SALES.OTHER', owner: 'PUBLIC' },
    }).model
    const grantsB = r2.privGrants.filter((g) => g.objectId === 'table:SALES.OTHER.B')
    expect(grantsB.some((g) => g.grantee === 'REPORTER')).toBe(true)
  })
})

describe('ownership transfer — COPY vs REVOKE CURRENT GRANTS', () => {
  it('REVOKE strips outbound grants; COPY keeps them; owner changes either way', () => {
    const base = baseScenario()
    base.objects['table:SALES.PUBLIC.ORDERS'].owner = 'SYSADMIN'
    grantPriv(base, 'SELECT', 'table:SALES.PUBLIC.ORDERS', 'ANALYST')
    addUser(base, 'sec', 'SECURITYADMIN')
    addRole(base, 'NEW_OWNER')

    const revoked = applyOp(base, 'sec', {
      op: 'GRANT_OWNERSHIP',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      toRole: 'NEW_OWNER',
      currentGrants: 'REVOKE',
    }).model
    expect(revoked.objects['table:SALES.PUBLIC.ORDERS'].owner).toBe('NEW_OWNER')
    expect(revoked.privGrants.some((g) => g.objectId === 'table:SALES.PUBLIC.ORDERS' && g.privilege === 'SELECT')).toBe(false)

    const copied = applyOp(base, 'sec', {
      op: 'GRANT_OWNERSHIP',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      toRole: 'NEW_OWNER',
      currentGrants: 'COPY',
    }).model
    expect(copied.objects['table:SALES.PUBLIC.ORDERS'].owner).toBe('NEW_OWNER')
    expect(copied.privGrants.some((g) => g.objectId === 'table:SALES.PUBLIC.ORDERS' && g.privilege === 'SELECT')).toBe(true)
  })
})

describe('SQL parser', () => {
  it('parses a privilege grant', () => {
    const m = baseScenario()
    const { ops, errors } = parseSql(m, 'GRANT USAGE ON WAREHOUSE ANALYTICS_WH TO ROLE ANALYST;')
    expect(errors).toHaveLength(0)
    expect(ops).toEqual([
      { op: 'GRANT_PRIV', privilege: 'USAGE', objectId: 'wh:ANALYTICS_WH', toRole: 'ANALYST', withGrantOption: false },
    ])
  })

  it('expands a multi-privilege grant into one op per privilege', () => {
    const m = baseScenario()
    const { ops } = parseSql(m, 'GRANT SELECT, INSERT ON TABLE SALES.PUBLIC.ORDERS TO ROLE ANALYST')
    expect(ops).toHaveLength(2)
    expect(ops.map((o) => (o as { privilege: string }).privilege).sort()).toEqual(['INSERT', 'SELECT'])
  })

  it('parses role grants, USE, future grants and ownership transfer', () => {
    const m = baseScenario()
    expect(parseSql(m, 'GRANT ROLE ANALYST TO USER ALICE').ops[0]).toEqual({
      op: 'GRANT_ROLE',
      role: 'ANALYST',
      to: { user: 'ALICE' },
    })
    expect(parseSql(m, 'USE ROLE SYSADMIN').ops[0]).toEqual({ op: 'USE_ROLE', role: 'SYSADMIN' })
    expect(parseSql(m, 'GRANT SELECT ON FUTURE TABLES IN SCHEMA SALES.PUBLIC TO ROLE ANALYST').ops[0]).toMatchObject({
      op: 'GRANT_FUTURE',
      privilege: 'SELECT',
      targetType: 'table',
      scope: { kind: 'SCHEMA', containerId: 'schema:SALES.PUBLIC' },
    })
    expect(
      parseSql(m, 'GRANT OWNERSHIP ON TABLE SALES.PUBLIC.ORDERS TO ROLE ANALYST COPY CURRENT GRANTS').ops[0],
    ).toMatchObject({ op: 'GRANT_OWNERSHIP', currentGrants: 'COPY', toRole: 'ANALYST' })
  })

  it('reports errors for unknown objects and privileges', () => {
    const m = baseScenario()
    expect(parseSql(m, 'GRANT SELECT ON TABLE NOPE TO ROLE ANALYST').errors).toHaveLength(1)
    expect(parseSql(m, 'GRANT FLY ON TABLE SALES.PUBLIC.ORDERS TO ROLE ANALYST').errors).toHaveLength(1)
  })

  it('parsed ops applied via SQL satisfy the access chain', () => {
    const m = baseScenario()
    addUser(m, 'sec', 'SECURITYADMIN')
    const sql = `
      GRANT USAGE ON WAREHOUSE ANALYTICS_WH TO ROLE ANALYST;
      GRANT USAGE ON DATABASE SALES TO ROLE ANALYST;
      GRANT USAGE ON SCHEMA SALES.PUBLIC TO ROLE ANALYST;
      GRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE ANALYST;
    `
    const { ops, errors } = parseSql(m, sql)
    expect(errors).toHaveLength(0)
    const { model, errors: applyErrors } = applyOps(m, 'sec', ops)
    expect(applyErrors).toHaveLength(0)
    expect(
      explainAccess(model, model.users.alice, {
        kind: 'SELECT',
        objectId: 'table:SALES.PUBLIC.ORDERS',
        warehouseId: 'wh:ANALYTICS_WH',
      }).allowed,
    ).toBe(true)
  })
})

describe('auto-grader', () => {
  it('passes when the goal is met and flags over-granting for least privilege', () => {
    const base = baseScenario()
    addUser(base, 'sec', 'SECURITYADMIN')
    const goalAction = { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' } as const

    // Minimal correct solution
    const minimal = applyOps(base, 'sec', [
      { op: 'GRANT_PRIV', privilege: 'USAGE', objectId: 'wh:ANALYTICS_WH', toRole: 'ANALYST' },
      { op: 'GRANT_PRIV', privilege: 'USAGE', objectId: 'db:SALES', toRole: 'ANALYST' },
      { op: 'GRANT_PRIV', privilege: 'USAGE', objectId: 'schema:SALES.PUBLIC', toRole: 'ANALYST' },
      { op: 'GRANT_PRIV', privilege: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', toRole: 'ANALYST' },
    ]).model

    const ref: LeastPrivilegeRef = {
      requiredGrants: [
        { privilege: 'USAGE', objectId: 'wh:ANALYTICS_WH', grantee: 'ANALYST' },
        { privilege: 'USAGE', objectId: 'db:SALES', grantee: 'ANALYST' },
        { privilege: 'USAGE', objectId: 'schema:SALES.PUBLIC', grantee: 'ANALYST' },
        { privilege: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', grantee: 'ANALYST' },
      ],
      penalizeExtra: true,
    }

    const good = gradeExercise(minimal, {
      goals: [{ description: 'Alice can SELECT ORDERS', user: 'alice', action: goalAction, expect: 'allow' }],
      leastPrivilege: ref,
      baseModel: base,
    })
    expect(good.passed).toBe(true)
    expect(good.leastPrivilege?.perfect).toBe(true)
    expect(good.score).toBeCloseTo(1)

    // Over-granting: also grant INSERT
    const over = applyOp(minimal, 'sec', {
      op: 'GRANT_PRIV',
      privilege: 'INSERT',
      objectId: 'table:SALES.PUBLIC.ORDERS',
      toRole: 'ANALYST',
    }).model
    const overResult = gradeExercise(over, {
      goals: [{ description: 'Alice can SELECT ORDERS', user: 'alice', action: goalAction, expect: 'allow' }],
      leastPrivilege: ref,
      baseModel: base,
    })
    expect(overResult.leastPrivilege?.extraGrants.length).toBe(1)
    expect(overResult.passed).toBe(false)
    expect(overResult.hints.some((h) => h.toLowerCase().includes('least privilege'))).toBe(true)
  })

  it('produces a hint pointing at the first missing link', () => {
    const base = baseScenario()
    const goalAction = { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' } as const
    const result = gradeExercise(base, {
      goals: [{ description: 'Alice can SELECT ORDERS', user: 'alice', action: goalAction, expect: 'allow' }],
    })
    expect(result.passed).toBe(false)
    expect(result.hints.length).toBeGreaterThan(0)
  })
})
