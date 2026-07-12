import type { LevelContent } from '../types'

export const level02: LevelContent = {
  id: 2,
  slug: 'roles-and-users',
  title: 'Roles, Users & Activation',
  subtitle: 'Primary and secondary roles',
  storyBeat:
    'Users log in, but roles do the work. Learn how a session activates roles — and why the rules for CREATE are special.',
  emoji: '🎭',
  badge: { emoji: '🔑', name: 'Role Caller' },
  estMinutes: 12,
  sections: [
    {
      kind: 'text',
      md: 'At Frostbyte, people log in — but **people never hold privileges**. A **role** is a bundle of privileges, and you grant *roles* to *users*. When someone authenticates, Snowflake opens a **session**, and it is the roles activated in that session that decide what the session may do.',
    },
    {
      kind: 'text',
      md: 'Every session carries exactly **one primary role** and **zero or more secondary roles**. Understanding the split between these two — and the one action where secondary roles do *not* count — is the whole point of this level.',
    },
    {
      kind: 'heading',
      text: 'Primary vs. secondary roles',
      level: 2,
    },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'Primary role',
          def: 'The single role your session is currently *acting as*. Set it with `USE ROLE <name>`, or it falls back to the user’s default role. `CURRENT_ROLE()` returns it.',
        },
        {
          term: 'Secondary roles',
          def: 'Additional granted roles activated alongside the primary role. Toggle them with `USE SECONDARY ROLES ALL | NONE`. `CURRENT_SECONDARY_ROLES()` lists the active ones.',
        },
      ],
    },
    {
      kind: 'text',
      md: 'For **any action except create**, the privileges of the **primary role _or_ any active secondary role** authorize it. So if you can `SELECT` a table through *either* your primary role or a secondary role, the query works. Secondary roles let a session pool its privileges without constantly switching primary roles.',
    },
    {
      kind: 'heading',
      text: 'The CREATE exception',
      level: 2,
    },
    {
      kind: 'text',
      md: 'There is one crucial exception. **CREATE uses the primary role only.** Because whichever role creates an object also *owns* it, ownership must be unambiguous — so Snowflake ignores secondary roles for `CREATE`. A privilege held only through a secondary role can never create an object.',
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'A privilege held only through a **secondary** role does **not** let you `CREATE` an object — CREATE always uses the primary role. If a create fails unexpectedly, check which role is primary.',
    },
    {
      kind: 'callout',
      variant: 'tip',
      md: 'To create an object owned by a specific role, `USE ROLE <that_role>` first so it is your primary role.',
    },
    {
      kind: 'heading',
      text: 'Activating roles in a session',
      level: 2,
    },
    {
      kind: 'text',
      md: 'Here is the full lifecycle in a session — set the primary role, switch secondary roles on, inspect what is active, then narrow back down to the primary role alone.',
    },
    {
      kind: 'sql',
      caption: 'Activating roles in a session',
      code: `USE ROLE data_engineer;        -- set the primary role
USE SECONDARY ROLES ALL;       -- activate all granted roles for non-CREATE actions
SELECT CURRENT_ROLE(), CURRENT_SECONDARY_ROLES();
USE SECONDARY ROLES NONE;      -- restrict to the primary role only`,
    },
    {
      kind: 'callout',
      variant: 'info',
      title: 'ALL is evaluated dynamically',
      md: '`USE SECONDARY ROLES ALL` is re-evaluated **per statement**. If a new role is granted to you mid-session, it activates automatically — no need to re-run `USE`. Many accounts now set `DEFAULT_SECONDARY_ROLES = ALL`, so sessions start with every granted role active.',
    },
    {
      kind: 'text',
      md: 'Experiment below: toggle secondary roles on and off and watch which actions succeed. Notice that `CREATE` always follows the primary role, no matter what the secondary switch is set to.',
    },
    {
      kind: 'widget',
      name: 'SecondaryRoleDemo',
    },
  ],
  quiz: [
    {
      type: 'boolean',
      prompt: 'You hold SELECT on a table through a secondary role. Can you query the table?',
      answer: true,
      explanation: 'Yes — non-CREATE actions honor secondary roles.',
    },
    {
      type: 'mcq',
      prompt:
        'A granted role has CREATE TABLE, but it is only one of your **secondary** roles. Can you create a table?',
      options: [
        'Yes, secondary roles can create',
        'No — CREATE uses the primary role only',
        'Only if you also have OWNERSHIP',
        'Only with USE SECONDARY ROLES ALL',
      ],
      answer: 1,
      explanation:
        'CREATE (and ownership) uses the primary role only; secondary roles cannot create objects.',
    },
    {
      type: 'boolean',
      prompt:
        'With USE SECONDARY ROLES ALL, a role granted to you mid-session becomes active without re-running USE.',
      answer: true,
      explanation: 'ALL is evaluated dynamically per statement.',
    },
    {
      type: 'mcq',
      prompt: 'Which function reveals the active secondary roles in your session?',
      options: [
        'CURRENT_ROLE()',
        'CURRENT_SECONDARY_ROLES()',
        'SHOW ROLES',
        'CURRENT_USER()',
      ],
      answer: 1,
      explanation:
        'CURRENT_SECONDARY_ROLES() lists active secondary roles; CURRENT_ROLE() shows the primary role.',
    },
    {
      type: 'mcq',
      prompt: 'Privileges are granted to ___, and ___ are granted to users.',
      options: ['users; privileges', 'roles; roles', 'objects; objects', 'warehouses; roles'],
      answer: 1,
      explanation: 'Privileges live on roles; roles are granted to users.',
    },
  ],
  references: [
    {
      label: 'USE SECONDARY ROLES',
      url: 'https://docs.snowflake.com/en/sql-reference/sql/use-secondary-roles',
    },
  ],
}
