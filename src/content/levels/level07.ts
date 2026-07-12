import type { LevelContent } from '../types'
import { selectChainSeed } from '../scenarios'

export const level07: LevelContent = {
  id: 7,
  slug: 'access-chain',
  title: 'The Access Chain',
  subtitle: 'Every link must hold for a query to run',
  storyBeat:
    'Alice from analytics can’t query the ORDERS table and she’s blocked. Time to trace the full chain of privileges a single SELECT actually needs.',
  emoji: '🔗',
  badge: { emoji: '⛓️', name: 'Chain Warden' },
  estMinutes: 14,
  sections: [
    { kind: 'text', md: 'Running `SELECT * FROM sales.public.orders` looks like one action, but Snowflake checks a **chain** of privileges. Miss any single link and the query fails.' },
    { kind: 'heading', text: 'The four links (plus a running warehouse)', level: 2 },
    {
      kind: 'list',
      ordered: true,
      items: [
        '`USAGE` on the **warehouse** — *and the warehouse must be running or resumable*',
        '`USAGE` on the **database**',
        '`USAGE` on the **schema**',
        '`SELECT` on the **table** (or `OWNERSHIP` of it)',
      ],
    },
    {
      kind: 'callout',
      variant: 'tip',
      md: 'Think of `USAGE` on the database and schema as “keys to the doors you pass through” to reach the table. Owning the table doesn’t let you skip those doors.',
    },
    { kind: 'heading', text: 'See it live', level: 2 },
    { kind: 'text', md: 'Toggle each grant below and watch the chain turn green. Notice that access is denied until **every** link is satisfied.' },
    { kind: 'widget', name: 'AccessChainDemo' },
    { kind: 'heading', text: 'Wiring it up in SQL', level: 2 },
    {
      kind: 'sql',
      caption: 'The four grants that unblock Alice',
      code: `GRANT USAGE  ON WAREHOUSE analytics_wh   TO ROLE analyst;
GRANT USAGE  ON DATABASE  sales           TO ROLE analyst;
GRANT USAGE  ON SCHEMA    sales.public     TO ROLE analyst;
GRANT SELECT ON TABLE     sales.public.orders TO ROLE analyst;`,
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'The most common miss is the **warehouse**. If a role has SELECT and both USAGE grants but no warehouse USAGE (or the warehouse is suspended with no auto-resume), the query still fails.',
    },
    { kind: 'text', md: 'Because privileges flow **up** the role hierarchy, granting `analyst` into a parent role hands that parent all four links at once — which is exactly how you scale access without re-granting everything.' },
  ],
  quiz: [
    {
      type: 'order',
      prompt: 'Put the four links of the SELECT access chain in order, from the outermost container inward:',
      items: ['USAGE on the warehouse', 'USAGE on the database', 'USAGE on the schema', 'SELECT on the table'],
      explanation: 'Warehouse to run the query, then database → schema → table for the container path down to the data.',
    },
    {
      type: 'mcq',
      prompt: 'A role has SELECT on the table and USAGE on the schema and database, but the query fails with “no active warehouse / cannot access”. What’s missing?',
      options: ['MODIFY on the schema', 'USAGE on a warehouse (and it must be running)', 'OWNERSHIP of the table', 'CREATE TABLE on the schema'],
      answer: 1,
      explanation: 'The warehouse link is missing. You need USAGE on a warehouse that is running or can auto-resume.',
    },
    {
      type: 'boolean',
      prompt: 'If a role OWNS the table, it no longer needs USAGE on the schema and database to query it.',
      answer: false,
      explanation: 'Ownership satisfies the table-level privilege, but you still need USAGE up the container chain (database and schema).',
    },
    {
      type: 'mcq',
      prompt: 'Privileges in the role hierarchy flow…',
      options: ['Down to child roles', 'Up to parent roles', 'Only to users', 'Sideways between peer roles'],
      answer: 1,
      explanation: 'A parent role inherits the privileges of the roles granted into it — privileges flow upward.',
    },
    {
      type: 'fill',
      prompt: 'Complete the grant that gives ANALYST permission to run queries on the ANALYTICS_WH warehouse:',
      before: 'GRANT ',
      after: ' ON WAREHOUSE analytics_wh TO ROLE analyst;',
      answers: ['USAGE'],
      explanation: 'USAGE on a warehouse lets a role run queries on it (OPERATE only resumes/suspends it).',
    },
  ],
  exercise: {
    id: 'access-chain-unblock-alice',
    title: 'Unblock Alice',
    brief:
      'Alice holds the **ANALYST** role but can’t query `SALES.PUBLIC.ORDERS`. Acting as **SECURITYADMIN**, grant ANALYST exactly what it needs — no more — so Alice can run her SELECT. Aim for **least privilege**.',
    seed: selectChainSeed,
    actor: 'sec',
    starterSql: '-- Grant ANALYST the four links of the access chain.\n-- Tip: warehouse, database, schema, then the table.\n',
    goals: [
      {
        description: 'Alice can SELECT from SALES.PUBLIC.ORDERS',
        user: 'alice',
        action: { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' },
        expect: 'allow',
      },
    ],
    leastPrivilege: {
      requiredGrants: [
        { privilege: 'USAGE', objectId: 'wh:ANALYTICS_WH', grantee: 'ANALYST' },
        { privilege: 'USAGE', objectId: 'db:SALES', grantee: 'ANALYST' },
        { privilege: 'USAGE', objectId: 'schema:SALES.PUBLIC', grantee: 'ANALYST' },
        { privilege: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', grantee: 'ANALYST' },
      ],
      penalizeExtra: true,
    },
    hints: [
      'Start with the warehouse: `GRANT USAGE ON WAREHOUSE ANALYTICS_WH TO ROLE ANALYST;`',
      'Then the two container doors: `GRANT USAGE ON DATABASE SALES TO ROLE ANALYST;` and `GRANT USAGE ON SCHEMA SALES.PUBLIC TO ROLE ANALYST;`',
      'Finally the data itself: `GRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE ANALYST;`',
    ],
    successMessage: 'That’s the full chain — every link green with nothing wasted. Alice is unblocked. 🎉',
  },
  references: [
    { label: 'Access control privileges', url: 'https://docs.snowflake.com/en/user-guide/security-access-control-privileges' },
    { label: 'Configuring access control', url: 'https://docs.snowflake.com/en/user-guide/security-access-control-configure' },
  ],
}
