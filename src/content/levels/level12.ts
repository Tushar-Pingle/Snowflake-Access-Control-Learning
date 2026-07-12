import type { LevelContent } from '../types'

export const level12: LevelContent = {
  id: 12,
  slug: 'rbac-design',
  title: 'RBAC Design Best Practices',
  subtitle: 'The two-hierarchy pattern',
  storyBeat:
    'A pile of ad-hoc grants becomes unmanageable fast. Time to design a role model that scales — the way seasoned Snowflake teams do.',
  emoji: '🏗️',
  badge: { emoji: '📐', name: 'Architect' },
  estMinutes: 13,
  sections: [
    {
      kind: 'text',
      md: 'Frostbyte started simple: a `SELECT` here, a `USAGE` there, granted to whichever role needed it that afternoon. Six months later nobody can answer a basic question — *who can read the sales data, and why?* Every audit turns into an archaeology dig. The fix is not more grants; it is **structure**.',
    },
    {
      kind: 'text',
      md: 'Seasoned Snowflake teams converge on the same design: **two kinds of roles, arranged in two hierarchies.** Get this pattern right once and adding a new dataset or a new job function becomes a handful of predictable grants instead of a guessing game.',
    },
    { kind: 'heading', text: 'Access roles vs. functional roles', level: 2 },
    {
      kind: 'text',
      md: 'Split your custom roles into two purposes. An **access role** is nothing but a bundle of object privileges on one resource — think `SALES_READ` or `SALES_WRITE`. A **functional role** is a job persona — `ANALYST`, `DATA_ENGINEER` — that owns *no* object privileges itself. Instead it is composed from access roles.',
    },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'Access role',
          def: 'Holds object privileges (`USAGE`, `SELECT`, `INSERT`, …) on a specific database, schema, or set of tables. Named for the resource and access level, e.g. `SALES_READ`, `SALES_WRITE`. Never granted directly to users.',
        },
        {
          term: 'Functional role',
          def: 'A persona that maps to a job. Named for the human role, e.g. `ANALYST`, `DATA_ENGINEER`. Built by granting access roles *into* it, then granted *to* users.',
        },
      ],
    },
    {
      kind: 'callout',
      variant: 'tip',
      md: 'Rule of thumb: **object privileges live on access roles; users get functional roles.** Never grant object privileges straight to a user-facing role.',
    },
    { kind: 'heading', text: 'Two hierarchies, one flow', level: 2 },
    {
      kind: 'text',
      md: 'The whole model is one directional chain. Object privileges flow *up* into access roles; access roles flow *up* into functional roles; functional roles flow *up* into users. When someone changes jobs you swap a single functional-role grant, and when a dataset gets a new table you update one access role — everyone downstream inherits it automatically.',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        '**Object → access role.** Grant `USAGE`/`SELECT`/etc. on the database, schema, and tables to an access role like `SALES_READ`.',
        '**Access role → functional role.** Grant `SALES_READ` into a persona like `ANALYST`.',
        '**Functional role → user.** Grant `ANALYST` to `alice`. She never touches a raw object privilege.',
      ],
    },
    {
      kind: 'sql',
      caption: 'The access-role / functional-role pattern',
      code: `-- Access role: object privileges
CREATE ROLE sales_read;
GRANT USAGE ON DATABASE sales TO ROLE sales_read;
GRANT USAGE ON SCHEMA sales.public TO ROLE sales_read;
GRANT SELECT ON ALL TABLES IN SCHEMA sales.public TO ROLE sales_read;

-- Functional role composes access roles; users get functional roles
CREATE ROLE analyst;
GRANT ROLE sales_read TO ROLE analyst;
GRANT ROLE analyst   TO ROLE SYSADMIN;   -- anchor under SYSADMIN
GRANT ROLE analyst   TO USER alice;`,
    },
    { kind: 'heading', text: 'Anchor everything under SYSADMIN', level: 2 },
    {
      kind: 'text',
      md: 'Notice the `GRANT ROLE analyst TO ROLE SYSADMIN` line. Every custom role should ultimately roll up to `SYSADMIN`. Because a parent role inherits all the privileges of its children, this keeps `SYSADMIN` able to see and manage every object in the account. Skip it and you create **orphaned privileges** — objects that live under a role no administrator can reach.',
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'Skipping the access/functional split — or forgetting to anchor custom roles under SYSADMIN — leaves objects that SYSADMIN can no longer manage.',
    },
    { kind: 'heading', text: 'Least privilege for the built-in roles', level: 2 },
    {
      kind: 'text',
      md: 'The two-hierarchy pattern is one half of good design; **least privilege** is the other. Use each system role for its intended job — `USERADMIN` to create users and roles, `SECURITYADMIN` to manage grants, `SYSADMIN` to own objects — and keep `ACCOUNTADMIN` reserved. `ACCOUNTADMIN` can do *anything*, including billing and account-level settings, so it should never be your day-to-day working role. Do routine work in the least-privileged functional role that gets the job done.',
    },
    {
      kind: 'callout',
      variant: 'info',
      title: 'Why it scales',
      md: 'New dataset? Create one access role and grant it into the personas that need it. New hire? Grant them one functional role. The blast radius of every change stays small and legible — exactly what audits and onboarding demand.',
    },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt: 'What is the difference between an access role and a functional role?',
      options: [
        'They are the same thing',
        'Access role = a bundle of object privileges; functional role = a persona composed of access roles',
        'Functional roles hold object privileges; access roles hold users',
        'Access roles are system-defined',
      ],
      answer: 1,
      explanation:
        'Access roles carry object privileges; functional roles (personas) are composed of access roles and granted to users.',
    },
    {
      type: 'mcq',
      prompt: 'Why grant custom roles into SYSADMIN?',
      options: [
        'To hide them',
        'So SYSADMIN retains management of all objects (no orphaned privileges)',
        'It is required to log in',
        'To make them primary roles',
      ],
      answer: 1,
      explanation: 'Anchoring under SYSADMIN keeps every object manageable by SYSADMIN.',
    },
    {
      type: 'boolean',
      prompt: 'Users should be granted access roles directly.',
      answer: false,
      explanation: 'Users get functional roles; access roles are granted to functional roles.',
    },
    {
      type: 'mcq',
      prompt: 'Which role should NOT be used for routine day-to-day work?',
      options: ['SYSADMIN', 'ANALYST', 'ACCOUNTADMIN', 'A custom functional role'],
      answer: 2,
      explanation:
        'ACCOUNTADMIN is powerful; reserve it and use least-privileged roles for routine work.',
    },
    {
      type: 'order',
      prompt:
        'Order the grants in the two-hierarchy pattern, from object privileges to the end user:',
      items: [
        'GRANT SELECT ON tables TO access role',
        'GRANT access role TO functional role',
        'GRANT functional role TO user',
      ],
      explanation: 'Object privileges → access role → functional role → user.',
    },
  ],
  references: [
    {
      label: 'Access control considerations',
      url: 'https://docs.snowflake.com/en/user-guide/security-access-control-considerations',
    },
  ],
}
