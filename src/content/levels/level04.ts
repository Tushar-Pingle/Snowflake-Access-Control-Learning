import type { LevelContent } from '../types'

export const level04: LevelContent = {
  id: 4,
  slug: 'privileges',
  title: 'The Privilege Catalog',
  subtitle: 'Object-type-specific permissions',
  storyBeat:
    'Each object type has its own vocabulary of privileges. Learn the important ones — and the subtle traps.',
  emoji: '🗝️',
  badge: { emoji: '📜', name: 'Privilege Scholar' },
  estMinutes: 12,
  sections: [
    {
      kind: 'text',
      md: 'A **privilege** is a single, named permission — like `SELECT` or `OPERATE` — that a role can hold on a specific object. But there is no universal list. Every **object type** defines its own vocabulary: the privileges that make sense on a warehouse are not the ones that make sense on a table.',
    },
    {
      kind: 'text',
      md: 'Getting access right means picking the *narrowest* privilege that lets a role do its job. This level is your field guide to the catalog — warehouse, database, schema, table, view, stage, function — plus the account-wide privileges and the one privilege that rules them all.',
    },
    {
      kind: 'heading',
      text: 'Warehouses: compute, not data',
      level: 2,
    },
    {
      kind: 'text',
      md: 'A warehouse is Snowflake compute. The privileges here govern *running* and *managing* the engine, never the data.',
    },
    {
      kind: 'deflist',
      rows: [
        { term: 'USAGE', def: 'Run queries on the warehouse.' },
        { term: 'OPERATE', def: 'Resume, suspend, or abort running queries on the warehouse.' },
        { term: 'MONITOR', def: 'View the warehouse and its query activity.' },
        { term: 'MODIFY', def: 'Change warehouse settings such as size or auto-suspend.' },
      ],
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: '`USAGE` on a **warehouse** (run queries) means something completely different from `USAGE` on a **database** (reach objects inside). Same word, different power.',
    },
    {
      kind: 'heading',
      text: 'Containers: databases and schemas',
      level: 2,
    },
    {
      kind: 'text',
      md: 'Databases and schemas are containers. Their privileges control whether you can *reach into* the container and whether you can *create* things inside it.',
    },
    {
      kind: 'list',
      items: [
        '**Database**: `USAGE` (reach objects inside), `MODIFY`, `MONITOR`, `CREATE SCHEMA`.',
        '**Schema**: `USAGE`, `MODIFY`, `MONITOR`, and a `CREATE <object>` family — `CREATE TABLE`, `CREATE VIEW`, `CREATE STAGE`, and so on.',
      ],
    },
    {
      kind: 'callout',
      variant: 'info',
      title: 'Reaching an object takes a chain',
      md: 'To read a table you generally need `USAGE` on its database **and** its schema, plus `SELECT` on the table itself. A privilege on the leaf is not enough if the doors on the way in are locked.',
    },
    {
      kind: 'heading',
      text: 'Data objects: tables, views, and more',
      level: 2,
    },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'Table',
          def: '`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, and `REFERENCES` (name it as a foreign-key target).',
        },
        { term: 'View', def: '`SELECT` and `REFERENCES`.' },
        {
          term: 'Stage',
          def: 'External stage → `USAGE`. Internal stage → `READ` and `WRITE`.',
        },
        {
          term: 'Function / procedure / sequence',
          def: '`USAGE` — the privilege to call or use it.',
        },
      ],
    },
    {
      kind: 'callout',
      variant: 'info',
      md: 'To *call* a function you need `USAGE` on it — not a special EXECUTE privilege.',
    },
    {
      kind: 'text',
      md: 'Two table privileges surprise people. `TRUNCATE` is its **own** privilege, separate from `DELETE`. And `REFERENCES` lets a role point a foreign key at a table *without* being able to read a single row from it.',
    },
    {
      kind: 'heading',
      text: 'Explore the catalog',
      level: 2,
    },
    {
      kind: 'text',
      md: 'Pick an object type below and see exactly which privileges apply to it — the fastest way to build a mental map of the catalog.',
    },
    {
      kind: 'widget',
      name: 'PrivilegeExplorer',
    },
    {
      kind: 'heading',
      text: 'Global privileges and OWNERSHIP',
      level: 2,
    },
    {
      kind: 'text',
      md: 'Some privileges are not attached to any single object — they are **account-level** powers: `CREATE DATABASE`, `CREATE ROLE`, `CREATE USER`, `CREATE WAREHOUSE`, `MANAGE GRANTS`, `MONITOR`, and the policy/tag powers `APPLY MASKING POLICY`, `APPLY ROW ACCESS POLICY`, and `APPLY TAG`.',
    },
    {
      kind: 'callout',
      variant: 'tip',
      title: 'OWNERSHIP is the master key',
      md: '`OWNERSHIP` is special: it is the full-control privilege. **Exactly one** role owns any given object, and ownership implies every right on it — including the ability to grant access to others.',
    },
    {
      kind: 'sql',
      caption: 'Granting the right privilege for the job',
      code: `GRANT OPERATE ON WAREHOUSE etl_wh TO ROLE data_engineer;   -- resume/suspend
GRANT CREATE TABLE ON SCHEMA sales.public TO ROLE data_engineer;
GRANT SELECT, INSERT, UPDATE ON TABLE sales.public.orders TO ROLE app_writer;`,
    },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt: 'What is the difference between warehouse USAGE and OPERATE?',
      options: [
        'They are identical',
        'USAGE runs queries on it; OPERATE resumes/suspends it',
        'USAGE resumes it; OPERATE runs queries',
        'OPERATE is only for databases',
      ],
      answer: 1,
      explanation:
        'USAGE lets a role run queries on the warehouse; OPERATE lets it resume/suspend/abort.',
    },
    {
      type: 'mcq',
      prompt:
        'Which privilege lets a role reference a table as a foreign-key target (without reading it)?',
      options: ['SELECT', 'REFERENCES', 'MODIFY', 'MONITOR'],
      answer: 1,
      explanation: 'REFERENCES allows FK references without granting read access.',
    },
    {
      type: 'mcq',
      prompt: 'Which privilege lets a role call a user-defined function?',
      options: ['EXECUTE', 'USAGE', 'SELECT', 'OPERATE'],
      answer: 1,
      explanation: 'USAGE on the function lets a role call it.',
    },
    {
      type: 'boolean',
      prompt: 'TRUNCATE is a separate table privilege, distinct from DELETE.',
      answer: true,
      explanation: 'Yes — TRUNCATE is its own table privilege.',
    },
    {
      type: 'mcq',
      prompt: 'Which single privilege confers all rights on an object?',
      options: ['MODIFY', 'MANAGE GRANTS', 'OWNERSHIP', 'MONITOR'],
      answer: 2,
      explanation:
        'OWNERSHIP is the full-control privilege; there is exactly one owner role per object.',
    },
  ],
  references: [
    {
      label: 'Access control privileges',
      url: 'https://docs.snowflake.com/en/user-guide/security-access-control-privileges',
    },
  ],
}
