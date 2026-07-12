import type { LevelContent } from '../types'
import {
  account,
  addDatabase,
  addRole,
  addSchema,
  addTableLike,
  addUser,
  addWarehouse,
  grantRoleToRole,
  grantRoleToUser,
  withSystemRoles,
  type AccountModel,
} from '../../engine'

/** Boss seed: access roles + functional roles exist, but none of the access wiring is done yet. */
function capstoneSeed(): AccountModel {
  const m = withSystemRoles(account())

  // Access roles (privilege bundles) and functional roles (personas).
  addRole(m, 'SALES_READ', 'account', 'Access role: read curated sales data')
  addRole(m, 'SALES_WRITE', 'account', 'Access role: load rows into sales tables')
  addRole(m, 'ANALYST', 'account', 'Functional role: analytics team')
  addRole(m, 'DATA_ENGINEER', 'account', 'Functional role: data engineering team')
  grantRoleToRole(m, 'ANALYST', 'SYSADMIN')
  grantRoleToRole(m, 'DATA_ENGINEER', 'SYSADMIN')

  addWarehouse(m, 'wh:ANALYTICS_WH', 'ANALYTICS_WH', 'SYSADMIN', { running: true, autoResume: true })
  addDatabase(m, 'db:SALES', 'SALES', 'SYSADMIN')
  addSchema(m, 'schema:SALES.PUBLIC', 'PUBLIC', 'SYSADMIN', 'db:SALES')
  addTableLike(m, 'table', 'table:SALES.PUBLIC.ORDERS', 'ORDERS', 'SYSADMIN', 'schema:SALES.PUBLIC')
  addTableLike(m, 'table', 'table:SALES.PUBLIC.CUSTOMERS', 'CUSTOMERS', 'SYSADMIN', 'schema:SALES.PUBLIC')

  // Users already hold their functional roles; the access wiring is the learner's job.
  addUser(m, 'alice', 'ANALYST')
  addUser(m, 'erik', 'DATA_ENGINEER')
  addUser(m, 'sec', 'SECURITYADMIN')
  grantRoleToUser(m, 'ANALYST', 'alice')
  grantRoleToUser(m, 'DATA_ENGINEER', 'erik')

  return m
}

export const level15: LevelContent = {
  id: 15,
  slug: 'capstone',
  title: 'Capstone: The Boss Mission',
  subtitle: 'Design and wire a real access model',
  storyBeat:
    'Final mission. Frostbyte is onboarding an analytics team and a data-engineering team. Build the access model with the two-hierarchy pattern — least privilege, no leaks — and prove every requirement holds.',
  emoji: '🏆',
  badge: { emoji: '❄️', name: 'Frostbyte Master' },
  estMinutes: 20,
  sections: [
    { kind: 'text', md: 'This brings everything together: the **access chain**, **role hierarchy**, the **access-role / functional-role** pattern, and **least privilege**.' },
    { kind: 'heading', text: 'The brief', level: 2 },
    { kind: 'text', md: 'Two access roles and two functional roles already exist. Your job, acting as **SECURITYADMIN**, is to grant privileges to the *access* roles and compose them into the *functional* roles that Alice and Erik already hold.' },
    {
      kind: 'deflist',
      rows: [
        { term: 'SALES_READ', def: 'Access role — should be able to **read** `ORDERS` and `CUSTOMERS`.' },
        { term: 'SALES_WRITE', def: 'Access role — should be able to **insert** into `ORDERS` (but not read `CUSTOMERS`).' },
        { term: 'ANALYST → alice', def: 'Functional role; must end up with read access via `SALES_READ`.' },
        { term: 'DATA_ENGINEER → erik', def: 'Functional role; must end up with write access via `SALES_WRITE`.' },
      ],
    },
    {
      kind: 'callout',
      variant: 'tip',
      md: 'Remember the pattern: object privileges live on **access roles**; then `GRANT ROLE <access_role> TO ROLE <functional_role>`. The users already have the functional roles.',
    },
    {
      kind: 'callout',
      variant: 'warning',
      md: 'Watch the **negative** requirements: Alice must **not** be able to INSERT into ORDERS, and Erik must **not** be able to SELECT from CUSTOMERS. Grant only what each role needs.',
    },
    { kind: 'text', md: 'When you think it’s wired correctly, hit **Grade my solution**. All five goals must be green.' },
  ],
  quiz: [
    {
      type: 'order',
      prompt: 'For the analytics team, order the wiring from object privilege to end user:',
      items: [
        'GRANT SELECT ON ORDERS TO ROLE SALES_READ',
        'GRANT ROLE SALES_READ TO ROLE ANALYST',
        'ANALYST is already granted to user alice',
      ],
      explanation: 'Object privileges go on the access role, the access role composes into the functional role, and the user already holds the functional role.',
    },
    {
      type: 'mcq',
      prompt: 'Alice (ANALYST) should read but not write. Which grant would violate least privilege?',
      options: [
        'GRANT SELECT ON ORDERS TO ROLE SALES_READ',
        'GRANT INSERT ON ORDERS TO ROLE SALES_READ',
        'GRANT USAGE ON SCHEMA sales.public TO ROLE SALES_READ',
        'GRANT ROLE SALES_READ TO ROLE ANALYST',
      ],
      answer: 1,
      explanation: 'Granting INSERT to the read access role would let analysts write — a least-privilege violation (and it would fail the “Alice cannot INSERT” goal).',
    },
    {
      type: 'boolean',
      prompt: 'Because privileges flow up the hierarchy, granting SALES_READ into ANALYST gives ANALYST all of SALES_READ’s access.',
      answer: true,
      explanation: 'Yes — the functional role inherits the access role’s privileges.',
    },
    {
      type: 'mcq',
      prompt: 'Why grant SALES_WRITE its own USAGE on the warehouse, database and schema instead of relying on SALES_READ’s grants?',
      options: [
        'It is not needed; USAGE is global',
        'Each role must independently satisfy the full access chain for its members',
        'USAGE cannot be granted twice',
        'SALES_WRITE inherits SALES_READ automatically',
      ],
      answer: 1,
      explanation: 'The roles are independent; DATA_ENGINEER inherits only SALES_WRITE, so SALES_WRITE must carry its own USAGE chain to reach ORDERS.',
    },
  ],
  exercise: {
    id: 'capstone-frostbyte',
    title: 'Wire the Frostbyte access model',
    brief:
      'Acting as **SECURITYADMIN**, grant privileges to `SALES_READ` and `SALES_WRITE`, then compose them into `ANALYST` and `DATA_ENGINEER`. Satisfy all five goals — including the two “must be denied” requirements.',
    seed: capstoneSeed,
    actor: 'sec',
    starterSql:
      '-- Access role: read team\n-- GRANT USAGE ... TO ROLE SALES_READ; (warehouse, database, schema)\n-- GRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE SALES_READ;\n-- GRANT SELECT ON TABLE SALES.PUBLIC.CUSTOMERS TO ROLE SALES_READ;\n\n-- Access role: write team\n-- GRANT USAGE ... TO ROLE SALES_WRITE; (warehouse, database, schema)\n-- GRANT INSERT ON TABLE SALES.PUBLIC.ORDERS TO ROLE SALES_WRITE;\n\n-- Compose access roles into functional roles\n-- GRANT ROLE SALES_READ TO ROLE ANALYST;\n-- GRANT ROLE SALES_WRITE TO ROLE DATA_ENGINEER;\n',
    goals: [
      { description: 'Alice can SELECT from ORDERS', user: 'alice', action: { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' }, expect: 'allow' },
      { description: 'Alice can SELECT from CUSTOMERS', user: 'alice', action: { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.CUSTOMERS', warehouseId: 'wh:ANALYTICS_WH' }, expect: 'allow' },
      { description: 'Alice CANNOT INSERT into ORDERS (read-only)', user: 'alice', action: { kind: 'INSERT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' }, expect: 'deny' },
      { description: 'Erik can INSERT into ORDERS', user: 'erik', action: { kind: 'INSERT', objectId: 'table:SALES.PUBLIC.ORDERS', warehouseId: 'wh:ANALYTICS_WH' }, expect: 'allow' },
      { description: 'Erik CANNOT SELECT from CUSTOMERS', user: 'erik', action: { kind: 'SELECT', objectId: 'table:SALES.PUBLIC.CUSTOMERS', warehouseId: 'wh:ANALYTICS_WH' }, expect: 'deny' },
    ],
    leastPrivilege: {
      requiredGrants: [
        { privilege: 'USAGE', objectId: 'wh:ANALYTICS_WH', grantee: 'SALES_READ' },
        { privilege: 'USAGE', objectId: 'db:SALES', grantee: 'SALES_READ' },
        { privilege: 'USAGE', objectId: 'schema:SALES.PUBLIC', grantee: 'SALES_READ' },
        { privilege: 'SELECT', objectId: 'table:SALES.PUBLIC.ORDERS', grantee: 'SALES_READ' },
        { privilege: 'SELECT', objectId: 'table:SALES.PUBLIC.CUSTOMERS', grantee: 'SALES_READ' },
        { privilege: 'USAGE', objectId: 'wh:ANALYTICS_WH', grantee: 'SALES_WRITE' },
        { privilege: 'USAGE', objectId: 'db:SALES', grantee: 'SALES_WRITE' },
        { privilege: 'USAGE', objectId: 'schema:SALES.PUBLIC', grantee: 'SALES_WRITE' },
        { privilege: 'INSERT', objectId: 'table:SALES.PUBLIC.ORDERS', grantee: 'SALES_WRITE' },
      ],
      penalizeExtra: false,
    },
    hints: [
      'SALES_READ needs the full read access chain: `USAGE` on ANALYTICS_WH, SALES, SALES.PUBLIC, then `SELECT` on both ORDERS and CUSTOMERS.',
      'SALES_WRITE needs its **own** USAGE chain plus `INSERT ON TABLE SALES.PUBLIC.ORDERS` — do not give it SELECT on CUSTOMERS.',
      'Finally compose the roles: `GRANT ROLE SALES_READ TO ROLE ANALYST;` and `GRANT ROLE SALES_WRITE TO ROLE DATA_ENGINEER;`',
    ],
    successMessage:
      'Flawless. Two teams, least-privilege access, no leaks — wired with the access-role / functional-role pattern. You’ve mastered Snowflake Access Control. ❄️🏆',
  },
  references: [
    { label: 'Access control considerations', url: 'https://docs.snowflake.com/en/user-guide/security-access-control-considerations' },
  ],
}
