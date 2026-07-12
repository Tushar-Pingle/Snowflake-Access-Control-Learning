import type { LevelContent } from '../types'

export const level03: LevelContent = {
  id: 3,
  slug: 'system-roles',
  title: 'System-Defined Roles',
  subtitle: 'The built-in roles and their hierarchy',
  storyBeat:
    'Snowflake ships with six special roles. Using the right one for each job is the first rule of a secure account.',
  emoji: '👑',
  badge: { emoji: '🏛️', name: 'Hierarch' },
  estMinutes: 12,
  sections: [
    {
      kind: 'text',
      md: 'Every Snowflake account is born with a handful of **system-defined roles** already in place. You never create them and you cannot drop them — they exist to bootstrap the account and to give each administrative job a proper home. Learning what each one is *for* is the difference between a tidy, auditable account and a sprawling mess where everyone logs in as the superuser.',
    },
    {
      kind: 'text',
      md: 'There are six: **ORGADMIN**, **ACCOUNTADMIN**, **SECURITYADMIN**, **USERADMIN**, **SYSADMIN**, and the pseudo-role **PUBLIC**. Five of them form a hierarchy inside the account; ORGADMIN stands apart on its own.',
    },
    {
      kind: 'heading',
      text: 'Meet the six roles',
      level: 2,
    },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'ORGADMIN',
          def: 'Operates at the **organization** level: create accounts, view all accounts, and monitor usage across the org. It is **standalone** — not part of the account role hierarchy and *not* granted to ACCOUNTADMIN.',
        },
        {
          term: 'ACCOUNTADMIN',
          def: 'The top of the **account** hierarchy. It encapsulates **SYSADMIN** and **SECURITYADMIN**, and adds billing and account-level parameters. The most powerful account role — use it sparingly.',
        },
        {
          term: 'SECURITYADMIN',
          def: 'Holds the global **MANAGE GRANTS** privilege, letting it grant or revoke privileges on any object. It also **inherits USERADMIN**, so it can manage users and roles too.',
        },
        {
          term: 'USERADMIN',
          def: 'Dedicated to identity: **CREATE USER** and **CREATE ROLE**, plus management of the users and roles it creates.',
        },
        {
          term: 'SYSADMIN',
          def: '**CREATE WAREHOUSE** and **CREATE DATABASE** (and all objects within them). By convention it is the **recommended parent of every custom role**.',
        },
        {
          term: 'PUBLIC',
          def: 'A **pseudo-role** automatically granted to every user and every role. Anything granted to PUBLIC is visible to everyone in the account.',
        },
      ],
    },
    {
      kind: 'callout',
      variant: 'info',
      md: '**ORGADMIN** is standalone — it is not part of the account role hierarchy and is *not* inherited by ACCOUNTADMIN.',
    },
    {
      kind: 'heading',
      text: 'The default hierarchy',
      level: 2,
    },
    {
      kind: 'text',
      md: 'Inside the account, the built-in roles are wired together with role grants. Because a parent role inherits everything its child roles can do, these grants explain *why* ACCOUNTADMIN is so powerful: it sits above both branches.',
    },
    {
      kind: 'list',
      items: [
        '`SYSADMIN → ACCOUNTADMIN` — ACCOUNTADMIN inherits object management.',
        '`SECURITYADMIN → ACCOUNTADMIN` — ACCOUNTADMIN inherits grant management.',
        '`USERADMIN → SECURITYADMIN` — SECURITYADMIN inherits user and role management.',
      ],
    },
    {
      kind: 'text',
      md: 'Read the arrows as "is granted to." So USERADMIN rolls up into SECURITYADMIN, and both SYSADMIN and SECURITYADMIN roll up into ACCOUNTADMIN. That is exactly why ACCOUNTADMIN can do nearly everything — and why it should be reserved for the rare tasks that genuinely need it.',
    },
    {
      kind: 'widget',
      name: 'SystemRoleHierarchy',
    },
    {
      kind: 'heading',
      text: 'Use the right role for each job',
      level: 2,
    },
    {
      kind: 'text',
      md: 'The secure workflow is to switch into the *least powerful* role that can do the task. Create people and roles as USERADMIN, hand out object privileges as SECURITYADMIN, and build and own objects as SYSADMIN.',
    },
    {
      kind: 'sql',
      caption: 'Use the right role for each job',
      code: `USE ROLE USERADMIN;      -- create users and roles
CREATE ROLE data_engineer;

USE ROLE SECURITYADMIN;  -- grant object privileges
GRANT USAGE ON WAREHOUSE etl_wh TO ROLE data_engineer;

USE ROLE SYSADMIN;       -- own objects; parent of custom roles
GRANT ROLE data_engineer TO ROLE SYSADMIN;`,
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'Doing everything as **ACCOUNTADMIN** is a common anti-pattern. Prefer USERADMIN (users/roles), SECURITYADMIN (grants), or SYSADMIN (objects).',
    },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt: 'Which system role holds MANAGE GRANTS by default?',
      options: ['USERADMIN', 'SECURITYADMIN', 'SYSADMIN', 'PUBLIC'],
      answer: 1,
      explanation: 'SECURITYADMIN holds global MANAGE GRANTS (and ACCOUNTADMIN inherits it).',
    },
    {
      type: 'mcq',
      prompt: 'USERADMIN is granted to which role by default?',
      options: ['ACCOUNTADMIN', 'SECURITYADMIN', 'SYSADMIN', 'ORGADMIN'],
      answer: 1,
      explanation: 'USERADMIN → SECURITYADMIN in the default hierarchy.',
    },
    {
      type: 'mcq',
      prompt: 'Which role should create and own warehouses and databases?',
      options: ['USERADMIN', 'SECURITYADMIN', 'SYSADMIN', 'PUBLIC'],
      answer: 2,
      explanation:
        'SYSADMIN creates warehouses/databases and is the recommended parent of custom roles.',
    },
    {
      type: 'boolean',
      prompt: 'ORGADMIN is part of ACCOUNTADMIN’s inheritance.',
      answer: false,
      explanation: 'ORGADMIN is standalone and not granted to ACCOUNTADMIN.',
    },
    {
      type: 'mcq',
      prompt: 'PUBLIC is automatically granted to…',
      options: [
        'Only the ACCOUNTADMIN role',
        'Every user and every role',
        'Only new users',
        'Nobody by default',
      ],
      answer: 1,
      explanation: 'PUBLIC is auto-granted to every user and every role.',
    },
  ],
  references: [
    {
      label: 'Overview of Access Control',
      url: 'https://docs.snowflake.com/en/user-guide/security-access-control-overview',
    },
  ],
}
