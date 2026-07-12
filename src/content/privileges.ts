/** Verified privilege catalog (curated subset) grouped by the object type they apply to. */

export type PrivCategory =
  | 'Global / Account'
  | 'Warehouse'
  | 'Database'
  | 'Schema'
  | 'Table'
  | 'View'
  | 'Stage'
  | 'Other schema objects'
  | 'Ownership'

export interface PrivilegeInfo {
  name: string
  category: PrivCategory
  appliesTo: string[]
  description: string
}

export const PRIVILEGES: PrivilegeInfo[] = [
  // Ownership
  { name: 'OWNERSHIP', category: 'Ownership', appliesTo: ['any object'], description: 'Full control of an object. Exactly one role owns each object; ownership implies all privileges and (outside managed access) the right to grant them.' },

  // Global / account
  { name: 'CREATE DATABASE', category: 'Global / Account', appliesTo: ['account'], description: 'Create databases in the account.' },
  { name: 'CREATE WAREHOUSE', category: 'Global / Account', appliesTo: ['account'], description: 'Create virtual warehouses.' },
  { name: 'CREATE ROLE', category: 'Global / Account', appliesTo: ['account'], description: 'Create account roles.' },
  { name: 'CREATE USER', category: 'Global / Account', appliesTo: ['account'], description: 'Create users.' },
  { name: 'MANAGE GRANTS', category: 'Global / Account', appliesTo: ['account', 'database', 'schema'], description: 'Grant or revoke privileges on any object (global), or on objects in a container (container-level). Held by SECURITYADMIN by default.' },
  { name: 'MONITOR', category: 'Global / Account', appliesTo: ['account', 'warehouse', 'database'], description: 'View usage, execution, and object metadata depending on scope.' },
  { name: 'APPLY MASKING POLICY', category: 'Global / Account', appliesTo: ['account'], description: 'Attach/detach masking policies (column-level security).' },
  { name: 'APPLY ROW ACCESS POLICY', category: 'Global / Account', appliesTo: ['account'], description: 'Attach/detach row access policies (row-level security).' },
  { name: 'APPLY TAG', category: 'Global / Account', appliesTo: ['account'], description: 'Assign object tags (needed for tag-based masking).' },

  // Warehouse
  { name: 'USAGE', category: 'Warehouse', appliesTo: ['warehouse'], description: 'Use the warehouse to run queries (it must also be running/resumable).' },
  { name: 'OPERATE', category: 'Warehouse', appliesTo: ['warehouse'], description: 'Resume, suspend, and abort queries on the warehouse.' },
  { name: 'MODIFY', category: 'Warehouse', appliesTo: ['warehouse', 'database', 'schema'], description: 'Alter properties of the object (e.g. warehouse size).' },

  // Database
  { name: 'USAGE (database)', category: 'Database', appliesTo: ['database'], description: 'Reference the database and see it — required to reach any object inside it.' },
  { name: 'CREATE SCHEMA', category: 'Database', appliesTo: ['database'], description: 'Create schemas in the database.' },

  // Schema
  { name: 'USAGE (schema)', category: 'Schema', appliesTo: ['schema'], description: 'Reference the schema — required to reach any object inside it.' },
  { name: 'CREATE TABLE', category: 'Schema', appliesTo: ['schema'], description: 'Create tables in the schema.' },
  { name: 'CREATE VIEW', category: 'Schema', appliesTo: ['schema'], description: 'Create views in the schema.' },
  { name: 'CREATE STAGE', category: 'Schema', appliesTo: ['schema'], description: 'Create stages in the schema.' },
  { name: 'CREATE STREAM', category: 'Schema', appliesTo: ['schema'], description: 'Create streams in the schema.' },
  { name: 'CREATE TASK', category: 'Schema', appliesTo: ['schema'], description: 'Create tasks in the schema.' },
  { name: 'CREATE FUNCTION', category: 'Schema', appliesTo: ['schema'], description: 'Create UDFs in the schema.' },

  // Table
  { name: 'SELECT', category: 'Table', appliesTo: ['table', 'view', 'stream'], description: 'Read rows from the table/view/stream.' },
  { name: 'INSERT', category: 'Table', appliesTo: ['table'], description: 'Add rows to the table.' },
  { name: 'UPDATE', category: 'Table', appliesTo: ['table'], description: 'Modify existing rows.' },
  { name: 'DELETE', category: 'Table', appliesTo: ['table'], description: 'Remove rows.' },
  { name: 'TRUNCATE', category: 'Table', appliesTo: ['table'], description: 'Empty the table.' },
  { name: 'REFERENCES', category: 'Table', appliesTo: ['table', 'view'], description: 'Reference the table as a foreign-key target (without reading the data).' },

  // Stage
  { name: 'READ', category: 'Stage', appliesTo: ['internal stage'], description: 'Read files from an internal stage.' },
  { name: 'WRITE', category: 'Stage', appliesTo: ['internal stage'], description: 'Write files to an internal stage.' },
  { name: 'USAGE (stage/function)', category: 'Other schema objects', appliesTo: ['external stage', 'function', 'procedure', 'sequence'], description: 'Use an external stage, or call a function / procedure / sequence.' },
  { name: 'OPERATE (task/pipe)', category: 'Other schema objects', appliesTo: ['task', 'pipe'], description: 'Resume/suspend a task or pipe.' },
]

export const PRIV_CATEGORIES: PrivCategory[] = [
  'Ownership',
  'Global / Account',
  'Warehouse',
  'Database',
  'Schema',
  'Table',
  'View',
  'Stage',
  'Other schema objects',
]
