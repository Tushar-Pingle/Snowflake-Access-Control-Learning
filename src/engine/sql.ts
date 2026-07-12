/**
 * A deliberately small, tolerant parser for the subset of Snowflake grant SQL the
 * simulator teaches. It lowers statements to structured {@link Op}s, resolving
 * object names against the current model.
 *
 * Supported forms (case-insensitive):
 *   GRANT <privs> ON <type> <name> TO ROLE <r> [WITH GRANT OPTION]
 *   GRANT OWNERSHIP ON <type> <name> TO ROLE <r> (COPY|REVOKE) CURRENT GRANTS
 *   GRANT <priv> ON FUTURE <type>S IN (SCHEMA|DATABASE) <name> TO ROLE <r>
 *   GRANT ROLE <r> TO (ROLE|USER) <name>
 *   REVOKE <privs> ON <type> <name> FROM ROLE <r>
 *   REVOKE ROLE <r> FROM (ROLE|USER) <name>
 *   CREATE <type> <name> [WITH MANAGED ACCESS]
 *   USE ROLE <r>
 *   USE SECONDARY ROLES (ALL|NONE)
 */
import { findObjectByName, makeObjectId } from './model'
import type { AccountModel, ObjectType, Op, Privilege } from './types'

const OBJECT_TYPE_KEYWORDS: Record<string, ObjectType> = {
  WAREHOUSE: 'warehouse',
  DATABASE: 'database',
  SCHEMA: 'schema',
  TABLE: 'table',
  VIEW: 'view',
  STAGE: 'stage',
  STREAM: 'stream',
  TASK: 'task',
  FUNCTION: 'function',
}

const KNOWN_PRIVILEGES: Privilege[] = [
  'OWNERSHIP', 'USAGE', 'OPERATE', 'MONITOR', 'MODIFY',
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'READ', 'WRITE',
  'CREATE SCHEMA', 'CREATE TABLE', 'CREATE VIEW', 'CREATE STAGE', 'CREATE STREAM',
  'CREATE TASK', 'CREATE FUNCTION', 'CREATE DATABASE', 'CREATE ROLE', 'CREATE USER',
  'CREATE WAREHOUSE', 'MANAGE GRANTS', 'APPLY MASKING POLICY', 'APPLY ROW ACCESS POLICY', 'APPLY TAG',
]

export interface ParseResult {
  ops: Op[]
  errors: { statement: string; error: string }[]
}

function normalize(stmt: string): string {
  return stmt.replace(/\s+/g, ' ').trim()
}

function parsePrivList(raw: string): Privilege[] | { error: string } {
  const parts = raw.split(',').map((p) => p.replace(/\s+/g, ' ').trim().toUpperCase())
  const out: Privilege[] = []
  for (const p of parts) {
    const match = KNOWN_PRIVILEGES.find((k) => k === p)
    if (!match) return { error: `Unknown privilege "${p}".` }
    out.push(match)
  }
  return out
}

function resolveObjectId(model: AccountModel, typeKw: string, name: string): string | { error: string } {
  const type = OBJECT_TYPE_KEYWORDS[typeKw.toUpperCase()]
  if (!type) return { error: `Unknown object type "${typeKw}".` }
  const obj = findObjectByName(model, name)
  if (!obj) return { error: `Object ${typeKw} "${name}" not found.` }
  if (obj.type !== type) return { error: `"${name}" is a ${obj.type}, not a ${type}.` }
  return obj.id
}

/** Parse one statement into a single Op (or an error). */
function parseStatement(model: AccountModel, original: string): Op | { error: string } {
  const s = normalize(original)
  const upper = s.toUpperCase()

  // USE ROLE / USE SECONDARY ROLES
  let m = upper.match(/^USE ROLE (\S+)$/)
  if (m) return { op: 'USE_ROLE', role: m[1] }
  m = upper.match(/^USE SECONDARY ROLES (ALL|NONE)$/)
  if (m) return { op: 'USE_SECONDARY_ROLES', value: m[1] as 'ALL' | 'NONE' }

  // GRANT ROLE r TO ROLE|USER x
  m = upper.match(/^GRANT ROLE (\S+) TO (ROLE|USER) (\S+)$/)
  if (m) {
    return {
      op: 'GRANT_ROLE',
      role: m[1],
      to: m[2] === 'USER' ? { user: m[3] } : { role: m[3] },
    }
  }
  m = upper.match(/^REVOKE ROLE (\S+) FROM (ROLE|USER) (\S+)$/)
  if (m) {
    return {
      op: 'REVOKE_ROLE',
      role: m[1],
      from: m[2] === 'USER' ? { user: m[3] } : { role: m[3] },
    }
  }

  // GRANT OWNERSHIP ON <type> <name> TO ROLE r (COPY|REVOKE) CURRENT GRANTS
  m = upper.match(/^GRANT OWNERSHIP ON (\w+) (.+?) TO ROLE (\S+) (COPY|REVOKE) CURRENT GRANTS$/)
  if (m) {
    const id = resolveObjectId(model, m[1], m[2])
    if (typeof id !== 'string') return id
    return { op: 'GRANT_OWNERSHIP', objectId: id, toRole: m[3], currentGrants: m[4] as 'COPY' | 'REVOKE' }
  }

  // GRANT <priv> ON FUTURE <type>S IN (SCHEMA|DATABASE) <name> TO ROLE r
  m = upper.match(/^GRANT (.+?) ON FUTURE (\w+?)S? IN (SCHEMA|DATABASE) (.+?) TO ROLE (\S+)$/)
  if (m) {
    const privs = parsePrivList(m[1])
    if ('error' in privs) return privs
    const targetType = OBJECT_TYPE_KEYWORDS[m[2].toUpperCase()]
    if (!targetType) return { error: `Unknown object type "${m[2]}".` }
    const container = findObjectByName(model, m[4])
    if (!container) return { error: `${m[3]} "${m[4]}" not found.` }
    return {
      op: 'GRANT_FUTURE',
      privilege: privs[0],
      targetType,
      scope: { kind: m[3] as 'SCHEMA' | 'DATABASE', containerId: container.id },
      toRole: m[5],
    }
  }

  // GRANT <privs> ON <type> <name> TO ROLE r [WITH GRANT OPTION]
  m = upper.match(/^GRANT (.+?) ON (\w+) (.+?) TO ROLE (\S+)( WITH GRANT OPTION)?$/)
  if (m) {
    const privs = parsePrivList(m[1])
    if ('error' in privs) return privs
    const id = resolveObjectId(model, m[2], m[3])
    if (typeof id !== 'string') return id
    // A statement with multiple privileges lowers to multiple ops; the caller flattens.
    // Here we return the first and rely on parseSql expanding — but to keep 1 op per call,
    // we encode all privileges by returning a synthetic multi-op via the first; parseSql handles the rest.
    return { op: 'GRANT_PRIV', privilege: privs[0], objectId: id, toRole: m[4], withGrantOption: !!m[5], __privs: privs } as Op & { __privs?: Privilege[] }
  }

  // REVOKE <privs> ON <type> <name> FROM ROLE r
  m = upper.match(/^REVOKE (.+?) ON (\w+) (.+?) FROM ROLE (\S+)$/)
  if (m) {
    const privs = parsePrivList(m[1])
    if ('error' in privs) return privs
    const id = resolveObjectId(model, m[2], m[3])
    if (typeof id !== 'string') return id
    return { op: 'REVOKE_PRIV', privilege: privs[0], objectId: id, fromRole: m[4], __privs: privs } as Op & { __privs?: Privilege[] }
  }

  // CREATE <type> <name> [WITH MANAGED ACCESS]
  m = upper.match(/^CREATE (\w+) (\S+)( WITH MANAGED ACCESS)?$/)
  if (m) {
    const type = OBJECT_TYPE_KEYWORDS[m[1].toUpperCase()]
    if (!type) return { error: `Cannot CREATE unknown object type "${m[1]}".` }
    const qualified = m[2].toUpperCase()
    const simpleName = qualified.split('.').pop()!
    // Derive the parent container id from the qualified name (drop the last segment).
    let parentId: string | undefined
    const segments = qualified.split('.')
    if (segments.length > 1) {
      const parentQualified = segments.slice(0, -1).join('.')
      const parentType: ObjectType = type === 'schema' ? 'database' : 'schema'
      parentId = makeObjectId(parentType, parentQualified)
    }
    return {
      op: 'CREATE_OBJECT',
      object: {
        id: makeObjectId(type, qualified),
        type,
        name: simpleName,
        parentId,
        owner: 'PUBLIC', // overridden to the actor's primary role by applyOp
        ...(m[3] ? { managedAccess: true } : {}),
      },
    }
  }

  return { error: `Could not parse statement.` }
}

export function parseSql(model: AccountModel, text: string): ParseResult {
  const statements = text
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith('--'))

  const ops: Op[] = []
  const errors: { statement: string; error: string }[] = []

  for (const stmt of statements) {
    const parsed = parseStatement(model, stmt)
    if ('error' in parsed) {
      errors.push({ statement: stmt, error: parsed.error })
      continue
    }
    // Expand multi-privilege GRANT/REVOKE into one op per privilege.
    const multi = (parsed as { __privs?: Privilege[] }).__privs
    if (multi && multi.length > 1 && (parsed.op === 'GRANT_PRIV' || parsed.op === 'REVOKE_PRIV')) {
      for (const p of multi) {
        const clone = { ...parsed, privilege: p } as Op & { __privs?: Privilege[] }
        delete clone.__privs
        ops.push(clone)
      }
    } else {
      const clone = { ...parsed } as Op & { __privs?: Privilege[] }
      delete clone.__privs
      ops.push(clone)
    }
  }

  return { ops, errors }
}
