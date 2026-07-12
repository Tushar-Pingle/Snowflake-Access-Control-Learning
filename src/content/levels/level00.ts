import type { LevelContent } from '../types'

export const level00: LevelContent = {
  id: 0,
  slug: 'orientation',
  title: 'Orientation: The Mental Model',
  subtitle: 'Who can do what, on which thing?',
  storyBeat:
    'Welcome to Frostbyte Inc.! You’re the new Data Platform admin. Before touching a single GRANT, learn how Snowflake thinks about access.',
  emoji: '🧭',
  badge: { emoji: '🎓', name: 'Initiate' },
  estMinutes: 8,
  sections: [
    { kind: 'text', md: 'Every access decision in Snowflake answers one question: **who** can do **what**, on **which thing**? Those three words map to the three pillars of the model.' },
    {
      kind: 'deflist',
      rows: [
        { term: 'Who → Role', def: 'A **role** is a bundle of privileges. Users authenticate, but it is *roles* — never users — that actually hold privileges.' },
        { term: 'What → Privilege', def: 'A **privilege** is a defined level of access, like `SELECT`, `USAGE`, or `OWNERSHIP`.' },
        { term: 'Which → Securable object', def: 'A **securable object** is anything you can grant access to: a table, schema, database, warehouse, and so on.' },
      ],
    },
    { kind: 'heading', text: 'Two models working together', level: 2 },
    { kind: 'text', md: 'Snowflake blends two classic access-control models:' },
    {
      kind: 'deflist',
      rows: [
        { term: 'DAC', def: 'Discretionary Access Control — every object has an **owner** role, and owners can grant access at their discretion.' },
        { term: 'RBAC', def: 'Role-Based Access Control — privileges are attached to **roles**, roles are granted to users (or to other roles).' },
      ],
    },
    { kind: 'text', md: 'Put together: a user activates a role, that role holds privileges, and those privileges apply to securable objects.' },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'You **cannot** grant a privilege directly to a user. `GRANT SELECT ON TABLE t TO USER bob` is invalid. Instead you grant the privilege to a *role*, then grant that *role* to the user.',
    },
    { kind: 'heading', text: 'The shape of every grant', level: 2 },
    {
      kind: 'sql',
      caption: 'Roles hold privileges; users get roles',
      code: `-- 1) A role bundles privileges on objects
GRANT SELECT ON TABLE sales.public.orders TO ROLE analyst;

-- 2) Users are given roles, never raw privileges
GRANT ROLE analyst TO USER alice;

-- 3) Alice activates the role to use it
USE ROLE analyst;`,
    },
    { kind: 'text', md: 'That’s the whole game. Everything else in this course — the role hierarchy, the access chain, ownership, governance — is a refinement of these three ideas.' },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt: 'Which statement is **valid** in Snowflake?',
      options: [
        'GRANT SELECT ON TABLE t TO USER bob;',
        'GRANT SELECT ON TABLE t TO ROLE analyst;',
        'GRANT ROLE analyst TO PRIVILEGE select;',
        'GRANT USER bob TO ROLE analyst;',
      ],
      answer: 1,
      explanation: 'Privileges are granted to **roles**, not users. You then grant the role to the user with `GRANT ROLE analyst TO USER bob`.',
    },
    {
      type: 'boolean',
      prompt: 'A user can hold a privilege directly, without any role.',
      answer: false,
      explanation: 'Only roles hold privileges. Users get *roles*; the roles carry the privileges.',
    },
    {
      type: 'mcq',
      prompt: 'The two access-control models Snowflake combines are:',
      options: ['ACL + RBAC', 'DAC + RBAC', 'DAC + MAC', 'RBAC + ABAC'],
      answer: 1,
      explanation: 'Snowflake combines Discretionary Access Control (object owners grant access) with Role-Based Access Control (privileges live on roles).',
    },
    {
      type: 'mcq',
      prompt: 'In “who can do what, on which thing”, the **who** is represented by a…',
      options: ['User', 'Role', 'Privilege', 'Warehouse'],
      answer: 1,
      explanation: 'The acting principal is always a role. Users only matter insofar as they can activate roles.',
    },
    {
      type: 'multi',
      prompt: 'Which of these are securable objects you can grant access to?',
      options: ['Table', 'Warehouse', 'Schema', 'A SELECT statement'],
      answers: [0, 1, 2],
      explanation: 'Tables, warehouses, and schemas are all securable objects. A SQL statement is not an object.',
    },
  ],
  references: [
    { label: 'Overview of Access Control', url: 'https://docs.snowflake.com/en/user-guide/security-access-control-overview' },
  ],
}
