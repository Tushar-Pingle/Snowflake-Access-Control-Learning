import type { LevelContent } from '../types'

export const level11: LevelContent = {
  id: 11,
  slug: 'database-roles',
  title: 'Database Roles',
  subtitle: 'Roles scoped to a single database',
  storyBeat:
    'As the account grows, account roles multiply. Database roles keep access packaged neatly inside the database it belongs to.',
  emoji: '🗄️',
  badge: { emoji: '🧭', name: 'Scoper' },
  estMinutes: 12,
  sections: [
    {
      kind: 'text',
      md: 'So far every role you have built has been an **account role** — created with `CREATE ROLE`, able to hold privileges on *any* object anywhere in the account, and eligible to be a session\'s primary or secondary role. That flexibility is powerful, but as Frostbyte grows it has a cost: roles pile up, and a role for one database\'s access ends up cluttering the whole account.',
    },
    {
      kind: 'text',
      md: 'A **database role** is a more tightly scoped tool. Created with `CREATE DATABASE ROLE db.role`, it lives *inside* a single database and can only ever hold privileges on objects in that database (and its future objects). Package a database\'s access as a database role and it travels with the database — self-contained and easy to share.',
    },
    {
      kind: 'heading',
      text: 'Account roles vs. database roles',
      level: 2,
    },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'Account role',
          def: 'Created with `CREATE ROLE`. Can hold privileges on **any** object in the account, and can serve as a session\'s primary or secondary role.',
        },
        {
          term: 'Database role',
          def: 'Created with `CREATE DATABASE ROLE db.role`. Scoped to **one** database — it can only hold privileges on objects in that database (including its future objects).',
        },
      ],
    },
    {
      kind: 'heading',
      text: 'Building a database role',
      level: 2,
    },
    {
      kind: 'text',
      md: 'Here we bundle read access to the `sales` database into a database role, then expose it to real sessions by granting it to an account role.',
    },
    {
      kind: 'sql',
      caption: 'Packaging database access as a database role',
      code: `CREATE DATABASE ROLE sales.analyst_dr;
GRANT USAGE ON SCHEMA sales.public TO DATABASE ROLE sales.analyst_dr;
GRANT SELECT ON ALL TABLES IN SCHEMA sales.public TO DATABASE ROLE sales.analyst_dr;

-- Reach it through an account role:
GRANT DATABASE ROLE sales.analyst_dr TO ROLE analyst;`,
    },
    {
      kind: 'heading',
      text: 'Who can a database role be granted to?',
      level: 2,
    },
    {
      kind: 'list',
      items: [
        'An **account role** — the usual way to make its privileges reachable in a session.',
        'Another **database role in the same database** — to compose scoped bundles.',
        'A **user** directly.',
      ],
    },
    {
      kind: 'text',
      md: 'The boundaries matter as much as the options: a database role **cannot** be granted to a database role in a *different* database, and an account role **cannot** be granted into a database role. The composition relationship only flows one way — database role into account role.',
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'You cannot `USE ROLE sales.analyst_dr` — a database role is never a session\'s primary role. Grant it to an account role and activate that instead.',
    },
    {
      kind: 'callout',
      variant: 'info',
      md: 'Account roles cannot be granted *into* database roles; the relationship only goes the other way (database role → account role).',
    },
    {
      kind: 'text',
      md: 'The payoff is bounded **role explosion**. Instead of minting a fresh account role for every slice of every database, you keep each database\'s access packaged inside the database itself. Access stays self-contained, easier to reason about, and share-friendly.',
    },
  ],
  quiz: [
    {
      type: 'boolean',
      prompt: 'A database role can be a session\'s primary role via USE ROLE.',
      answer: false,
      explanation: 'No — activate it by granting it to an account role.',
    },
    {
      type: 'mcq',
      prompt: 'A database role can be granted to which of these?',
      options: [
        'A database role in a different database',
        'An account role, a same-database database role, or a user',
        'Only ACCOUNTADMIN',
        'Nothing — it stands alone',
      ],
      answer: 1,
      explanation:
        'Valid grantees are an account role, another database role in the same database, or a user.',
    },
    {
      type: 'boolean',
      prompt: 'An account role can be granted into a database role.',
      answer: false,
      explanation: 'No — only the reverse (database role → account role) is allowed.',
    },
    {
      type: 'mcq',
      prompt: 'What problem do database roles primarily mitigate?',
      options: [
        'Slow queries',
        'Role explosion / cross-database role sprawl',
        'Weak passwords',
        'Warehouse cost',
      ],
      answer: 1,
      explanation:
        'They keep access scoped to one database and reduce account-role sprawl.',
    },
    {
      type: 'mcq',
      prompt: 'A database role scoped to SALES can hold privileges on…',
      options: [
        'Any object in the account',
        'Only objects in the SALES database',
        'Only warehouses',
        'Only account-level objects',
      ],
      answer: 1,
      explanation: 'Its privileges are limited to objects in its own database.',
    },
  ],
  references: [
    {
      label: 'CREATE DATABASE ROLE',
      url: 'https://docs.snowflake.com/en/sql-reference/sql/create-database-role',
    },
  ],
}
