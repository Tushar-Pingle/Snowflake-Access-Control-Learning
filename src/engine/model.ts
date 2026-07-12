/** Helpers for reading and cloning the {@link AccountModel}. Pure, no mutation of inputs. */
import type { AccountModel, ObjectId, ObjectType, SecurableObject } from './types'

/** Deep clone so operations can return a new model without mutating the caller's. */
export function cloneModel(model: AccountModel): AccountModel {
  // structuredClone is available in modern browsers and Node >= 17.
  return structuredClone(model)
}

export function getObject(model: AccountModel, id: ObjectId | undefined): SecurableObject | undefined {
  return id ? model.objects[id] : undefined
}

export function parentOf(model: AccountModel, id: ObjectId | undefined): SecurableObject | undefined {
  const obj = getObject(model, id)
  return obj?.parentId ? getObject(model, obj.parentId) : undefined
}

/** Walk up the container chain until an object of `type` is found (inclusive of the start). */
export function ancestorOfType(
  model: AccountModel,
  id: ObjectId | undefined,
  type: ObjectType,
): SecurableObject | undefined {
  let cur = getObject(model, id)
  const seen = new Set<ObjectId>()
  while (cur && !seen.has(cur.id)) {
    if (cur.type === type) return cur
    seen.add(cur.id)
    cur = getObject(model, cur.parentId)
  }
  return undefined
}

export function enclosingSchema(model: AccountModel, id: ObjectId | undefined): SecurableObject | undefined {
  return ancestorOfType(model, id, 'schema')
}

export function enclosingDatabase(model: AccountModel, id: ObjectId | undefined): SecurableObject | undefined {
  return ancestorOfType(model, id, 'database')
}

/** All immediate + transitive container ancestors (excluding the object itself). */
export function ancestors(model: AccountModel, id: ObjectId | undefined): SecurableObject[] {
  const out: SecurableObject[] = []
  let cur = getObject(model, id)
  const seen = new Set<ObjectId>()
  while (cur && cur.parentId && !seen.has(cur.parentId)) {
    const parent = getObject(model, cur.parentId)
    if (!parent) break
    seen.add(parent.id)
    out.push(parent)
    cur = parent
  }
  return out
}

/** Human-friendly qualified name, e.g. "SALES.PUBLIC.ORDERS". */
export function qualifiedName(model: AccountModel, id: ObjectId): string {
  const obj = model.objects[id]
  if (!obj) return id
  const chain = [obj, ...ancestors(model, id)]
    .filter((o) => o.type !== 'account' && o.type !== 'warehouse')
    .reverse()
    .map((o) => o.name)
  return chain.length ? chain.join('.') : obj.name
}

/** Find an object by its (case-insensitive) qualified or simple name. */
export function findObjectByName(model: AccountModel, name: string): SecurableObject | undefined {
  const target = name.trim().toUpperCase()
  return (
    Object.values(model.objects).find((o) => qualifiedName(model, o.id).toUpperCase() === target) ??
    Object.values(model.objects).find((o) => o.name.toUpperCase() === target)
  )
}

/** Build an object id from a type + qualified name, matching the convention used in seeds. */
export function makeObjectId(type: ObjectType, qualified: string): ObjectId {
  const prefix: Record<ObjectType, string> = {
    account: 'account',
    warehouse: 'wh',
    database: 'db',
    schema: 'schema',
    table: 'table',
    view: 'view',
    stage: 'stage',
    stream: 'stream',
    task: 'task',
    function: 'function',
  }
  return `${prefix[type]}:${qualified.toUpperCase()}`
}
