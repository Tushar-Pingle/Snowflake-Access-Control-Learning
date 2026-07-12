import type { LevelContent } from '../types'

export const level01: LevelContent = {
  id: 1,
  slug: 'securable-objects',
  title: 'The Securable Object Hierarchy',
  subtitle: 'Everything you can grant access to',
  storyBeat:
    'Before you can secure the warehouse, you need a map of what lives where. Databases, schemas, warehouses — which contains which?',
  emoji: '🧱',
  badge: { emoji: '🗺️', name: 'Cartographer' },
  estMinutes: 10,
  sections: [
    {
      kind: 'text',
      md: 'In Snowflake, a **securable object** is anything you can grant access to — a table, a warehouse, a schema, even a role. Every `GRANT` statement you will ever write names one of these objects. So before you can hand out access, you need a map of what exists and, crucially, **what contains what**.',
    },
    {
      kind: 'text',
      md: 'The objects nest like a set of Russian dolls. The **Organization** holds one or more **Accounts**; an account holds **Databases**; each database holds **Schemas**; and each schema holds the working objects you touch every day — tables, views, stages, and more. Where an object sits in this tree determines how you reach it.',
    },
    {
      kind: 'heading',
      text: 'The three levels that matter',
      level: 2,
    },
    {
      kind: 'text',
      md: 'Day to day, you will think in three tiers: **account-level**, **database-level**, and **schema-level** objects. Getting these right is the difference between a `GRANT` that works and one that fails with a confusing error.',
    },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'Account-level',
          def: 'Objects that live directly under the account, not inside any database: **users**, **roles**, **warehouses**, **resource monitors**, **integrations**, **network policies**, **shares** — and databases themselves.',
        },
        {
          term: 'Database-level',
          def: 'What a database contains: **schemas** (and **database roles**).',
        },
        {
          term: 'Schema-level',
          def: 'The everyday working objects inside a schema: **tables**, **views** (including secure and materialized views), **stages**, **streams**, **tasks**, **functions/procedures**, **sequences**, **masking policies**, **row access policies**, and **tags**.',
        },
      ],
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'A **warehouse** is an *account-level* object — it is not "inside" a database. Neither are resource monitors, roles, or users.',
    },
    {
      kind: 'text',
      md: 'A couple of placements surprise people. **Masking policies**, **row access policies**, and **tags** feel like account-wide governance controls, yet they are ordinary **schema-level** objects — they live inside a schema just like a table does. Meanwhile **warehouses** and **resource monitors**, which power your queries, sit at the **account** level and never belong to a database.',
    },
    {
      kind: 'heading',
      text: 'Explore the tree yourself',
      level: 2,
    },
    {
      kind: 'text',
      md: 'The tree below lets you expand each container and see what it holds. Notice how account-level objects sit as siblings of your databases, while tables and policies are tucked deep inside a schema.',
    },
    {
      kind: 'widget',
      name: 'ObjectHierarchyTree',
    },
    {
      kind: 'text',
      md: 'The same structure shows up in SQL. `SHOW` commands walk the hierarchy one level at a time — list databases, then schemas within a database, then objects within a schema.',
    },
    {
      kind: 'sql',
      caption: 'Explore the hierarchy',
      code: `SHOW DATABASES;
SHOW SCHEMAS IN DATABASE sales;
SHOW OBJECTS IN SCHEMA sales.public;`,
    },
    {
      kind: 'heading',
      text: 'The access chain',
      level: 2,
    },
    {
      kind: 'text',
      md: 'Here is the single most important rule for schema-level objects. To operate on an object inside a schema, you need **at least one privilege on the parent database and one on the parent schema** — most often `USAGE` on each — *before* any privilege on the object itself. This layered requirement is the root of what we call the **access chain**.',
    },
    {
      kind: 'callout',
      variant: 'info',
      md: 'To reach any object inside a schema you first need `USAGE` on its database **and** `USAGE` on its schema — think of them as doors you must pass through.',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        '`USAGE` on the **database** — pass through the outer door.',
        '`USAGE` on the **schema** — pass through the inner door.',
        '`SELECT` (or another object privilege) on the **table** — now you can act on it.',
      ],
    },
    {
      kind: 'callout',
      variant: 'tip',
      md: 'When a `SELECT` mysteriously fails even though the role holds `SELECT` on the table, the missing link is almost always `USAGE` on the database or schema. Check the whole chain, not just the object.',
    },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt: 'A **warehouse** is which kind of securable object?',
      options: ['Schema-level', 'Account-level', 'Database-level', 'Organization-level'],
      answer: 1,
      explanation: 'Warehouses are account-level objects, not stored inside a database.',
    },
    {
      type: 'order',
      prompt: 'Order the container chain from the account down to a table:',
      items: ['Account', 'Database', 'Schema', 'Table'],
      explanation: 'Account contains databases, which contain schemas, which contain tables.',
    },
    {
      type: 'mcq',
      prompt: 'A **masking policy** is which level of object?',
      options: ['Account-level', 'Database-level', 'Schema-level', 'It is not an object'],
      answer: 2,
      explanation: 'Masking policies (and row access policies and tags) are schema-level objects.',
    },
    {
      type: 'multi',
      prompt: 'Which of these are **account-level** securables?',
      options: ['Warehouse', 'Table', 'Role', 'Schema'],
      answers: [0, 2],
      explanation: 'Warehouses and roles are account-level. Tables and schemas live inside databases.',
    },
    {
      type: 'boolean',
      prompt: 'To act on a schema-level object you need privileges on both the parent database and the parent schema.',
      answer: true,
      explanation: 'Yes — usually USAGE on the database and USAGE on the schema, before any object-level privilege.',
    },
  ],
  references: [
    {
      label: 'Overview of Access Control',
      url: 'https://docs.snowflake.com/en/user-guide/security-access-control-overview',
    },
  ],
}
