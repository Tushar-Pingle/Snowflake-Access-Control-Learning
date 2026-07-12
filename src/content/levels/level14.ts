import type { LevelContent } from '../types'

export const level14: LevelContent = {
  id: 14,
  slug: 'auditing',
  title: 'Auditing & Introspection',
  subtitle: 'Answering “who can access what?”',
  storyBeat:
    'Security is only as good as your ability to inspect it. Learn to answer, precisely, who can touch any object — and prove it.',
  emoji: '🔎',
  badge: { emoji: '📖', name: 'Auditor' },
  estMinutes: 11,
  sections: [
    {
      kind: 'text',
      md: 'A grant you cannot see is a grant you cannot govern. Every good access-control story ends the same way: someone asks *“who can read this table?”* and you answer with **evidence**, not a guess. Snowflake gives you three complementary lenses for that — the `SHOW GRANTS` family, the `SNOWFLAKE.ACCOUNT_USAGE` views, and each database’s `INFORMATION_SCHEMA`.',
    },
    {
      kind: 'text',
      md: 'This level is your toolkit for introspection: how to read the grant graph from any direction, and which source to trust for real-time truth versus account-wide history.',
    },
    { kind: 'heading', text: 'The SHOW GRANTS family', level: 2 },
    {
      kind: 'text',
      md: '`SHOW GRANTS` is the fastest, lowest-latency way to inspect access. It runs live against the metadata layer and returns exactly what is granted right now. The trick is picking the right **direction** to look — you can start from a role, a user, or an object.',
    },
    {
      kind: 'deflist',
      rows: [
        { term: 'SHOW GRANTS TO ROLE r', def: 'Lists the **privileges the role holds** (and roles granted to it). Answers: *what can this role do?*' },
        { term: 'SHOW GRANTS OF ROLE r', def: 'Lists the **principals the role is granted to** — the users and roles that have it. Answers: *who has this role?*' },
        { term: 'SHOW GRANTS TO USER u', def: 'Lists the **roles a user has** been granted directly. Answers: *what roles does this user carry?*' },
        { term: 'SHOW GRANTS ON <object>', def: 'Lists **every grant on that object**. Answers: *who can access this thing?*' },
        { term: 'SHOW FUTURE GRANTS IN SCHEMA s', def: 'Lists the **future grants** that will apply to objects created later in the schema.' },
      ],
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'Mind the preposition: `SHOW GRANTS TO ROLE r` shows privileges the role *holds*, while `SHOW GRANTS OF ROLE r` shows *who has* the role.',
    },
    {
      kind: 'sql',
      caption: 'Inspecting grants',
      code: `SHOW GRANTS TO ROLE analyst;      -- privileges the role holds
SHOW GRANTS OF ROLE analyst;      -- who has the role
SHOW GRANTS ON TABLE sales.public.orders;  -- who can access the object

SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.GRANTS_TO_ROLES
 WHERE grantee_name = 'ANALYST' AND deleted_on IS NULL;`,
    },
    { kind: 'heading', text: 'Two catalogs: ACCOUNT_USAGE vs INFORMATION_SCHEMA', level: 2 },
    {
      kind: 'text',
      md: '`SHOW GRANTS` is great for a single question, but auditing at scale means querying grants like data. Snowflake exposes two SQL-queryable catalogs for that, and knowing their trade-offs is the whole game.',
    },
    {
      kind: 'list',
      items: [
        '**`SNOWFLAKE.ACCOUNT_USAGE`** — account-wide views like `GRANTS_TO_ROLES`, `GRANTS_TO_USERS`, and `ROLES`, plus history views such as `ACCESS_HISTORY`, `QUERY_HISTORY`, and `LOGIN_HISTORY`. It spans the *entire account*, has some **latency**, and **includes dropped objects** (filter `deleted_on IS NULL` to see only live grants).',
        '**`INFORMATION_SCHEMA`** — a per-database schema with `OBJECT_PRIVILEGES`, `TABLE_PRIVILEGES`, and the `ENABLED_ROLES` table function. It is **real-time** with no latency, but **scoped to a single database** and reflects only currently existing objects.',
      ],
    },
    {
      kind: 'callout',
      variant: 'info',
      md: 'ACCOUNT_USAGE is account-wide but has latency (and includes dropped objects); INFORMATION_SCHEMA is real-time but scoped to one database.',
    },
    {
      kind: 'callout',
      variant: 'tip',
      md: 'Use `INFORMATION_SCHEMA` when you need the current, exact truth for one database (e.g. verifying a grant you just issued), and `ACCOUNT_USAGE` when you need account-wide coverage or historical trails — accepting a few minutes of lag.',
    },
    {
      kind: 'text',
      md: 'Together these let you triangulate any access question: `SHOW GRANTS` for a quick live check, `INFORMATION_SCHEMA` for real-time per-database detail, and `ACCOUNT_USAGE` for the full account picture and history — the raw material for proving *who could access what, and who actually did*.',
    },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt: 'What is the difference between SHOW GRANTS TO ROLE and SHOW GRANTS OF ROLE?',
      options: [
        'They are identical',
        'TO = privileges the role holds; OF = principals the role is granted to',
        'TO = who has the role; OF = privileges',
        'OF works only for users',
      ],
      answer: 1,
      explanation: 'TO lists privileges the role holds; OF lists who has the role.',
    },
    {
      type: 'mcq',
      prompt: 'Which source is account-wide, has latency, and includes dropped objects?',
      options: ['INFORMATION_SCHEMA', 'SNOWFLAKE.ACCOUNT_USAGE', 'SHOW GRANTS', 'CURRENT_ROLE()'],
      answer: 1,
      explanation: 'ACCOUNT_USAGE is account-wide with latency and includes dropped objects.',
    },
    {
      type: 'mcq',
      prompt: 'Which source is real-time but scoped to a single database?',
      options: ['ACCOUNT_USAGE', 'INFORMATION_SCHEMA', 'ORGANIZATION_USAGE', 'LOGIN_HISTORY'],
      answer: 1,
      explanation: 'INFORMATION_SCHEMA is real-time and per-database.',
    },
    {
      type: 'mcq',
      prompt: 'Which ACCOUNT_USAGE view audits every role→privilege grant account-wide?',
      options: ['GRANTS_TO_USERS', 'GRANTS_TO_ROLES', 'ROLES', 'ACCESS_HISTORY'],
      answer: 1,
      explanation: 'GRANTS_TO_ROLES records role→privilege grants across the account.',
    },
    {
      type: 'mcq',
      prompt: 'Which command shows who can access a specific table?',
      options: ['SHOW GRANTS TO ROLE', 'SHOW GRANTS ON TABLE db.sch.t', 'SHOW ROLES', 'SHOW WAREHOUSES'],
      answer: 1,
      explanation: 'SHOW GRANTS ON <object> lists the grants on that object.',
    },
  ],
  references: [
    { label: 'SHOW GRANTS', url: 'https://docs.snowflake.com/en/sql-reference/sql/show-grants' },
  ],
}
