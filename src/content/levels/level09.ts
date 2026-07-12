import type { LevelContent } from '../types'

export const level09: LevelContent = {
  id: 9,
  slug: 'managed-access',
  title: 'Managed Access Schemas',
  subtitle: 'Centralizing grant authority',
  storyBeat:
    'Object owners granting access however they like can quietly widen exposure. Managed access puts security back in one pair of hands.',
  emoji: '🛡️',
  badge: { emoji: '🔐', name: 'Gatekeeper' },
  estMinutes: 11,
  sections: [
    {
      kind: 'text',
      md: 'By default, Snowflake follows a **discretionary access control (DAC)** model: whoever *owns* an object gets to decide who can use it. If you own the `orders` table, you can `GRANT SELECT` on it to any role you like. Convenient — but it means grant authority is scattered across every object owner in the account.',
    },
    {
      kind: 'text',
      md: 'That scattering is exactly the problem a **managed access schema** solves. It takes the "you can grant on what you own" power away from individual owners and hands it to one central authority: the **schema owner**.',
    },
    { kind: 'heading', text: 'The default: owners hold the keys', level: 2 },
    {
      kind: 'text',
      md: 'In a normal schema, an object\'s **OWNER** role can grant privileges on that object. Own a table, and you can hand out `SELECT`, `INSERT`, and more to anyone — no one else needs to approve it. This is flexible, but it makes it hard to answer "who can grant access to sensitive data?" because the answer is *every owner of every object*.',
    },
    { kind: 'heading', text: 'Managed access: one gatekeeper', level: 2 },
    {
      kind: 'text',
      md: 'Adding `WITH MANAGED ACCESS` to a schema **centralizes** grant authority. Once managed access is on, only the **schema owner** or a role holding the **MANAGE GRANTS** privilege may grant privileges on objects in that schema. Object owners are cut out of the granting business entirely.',
    },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'Normal schema (DAC)',
          def: 'The **object owner** grants privileges on their objects — grant authority is distributed.',
        },
        {
          term: 'Managed access schema',
          def: 'Only the **schema owner** (or a **MANAGE GRANTS** holder) grants privileges on objects in the schema — grant authority is centralized.',
        },
        {
          term: 'Object ownership',
          def: 'Unchanged in both cases. Owners keep OWNERSHIP; managed access only removes their ability to *grant*.',
        },
      ],
    },
    {
      kind: 'sql',
      caption: 'Enabling managed access',
      code: `CREATE SCHEMA sales.secure WITH MANAGED ACCESS;
ALTER SCHEMA sales.public ENABLE MANAGED ACCESS;

-- Now even a table's owner cannot grant on it; route grants through the schema owner:
USE ROLE schema_owner;
GRANT SELECT ON TABLE sales.secure.orders TO ROLE analyst;`,
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'Managed access does **not** strip ownership — it strips the *grant authority*. The object owner still owns the object; they just cannot hand out access to it.',
    },
    { kind: 'heading', text: 'Current and future objects', level: 2 },
    {
      kind: 'text',
      md: 'The centralized control is not a one-time snapshot. Managed access governs **every object in the schema**, including tables, views, and other objects **created in the future**. A new table added tomorrow is automatically covered — its owner still cannot grant on it.',
    },
    {
      kind: 'text',
      md: 'Explore below how a grant attempt behaves differently depending on who is trying it and whether managed access is enabled.',
    },
    { kind: 'widget', name: 'ManagedAccessDemo' },
    {
      kind: 'callout',
      variant: 'tip',
      md: 'Use managed-access schemas for sensitive data so a central security role, not individual object owners, controls who gets in.',
    },
    {
      kind: 'list',
      items: [
        'Owners keep **OWNERSHIP** but lose the ability to **GRANT** on their objects.',
        'Grants must come from the **schema owner** or a **MANAGE GRANTS** holder.',
        'Coverage extends to **current and future** objects in the schema.',
        'Result: owners cannot **silently widen** access to sensitive data.',
      ],
    },
  ],
  quiz: [
    {
      type: 'boolean',
      prompt: 'In a managed-access schema, the table\'s owner can still grant SELECT on it.',
      answer: false,
      explanation: 'No — only the schema owner or a MANAGE GRANTS holder may grant there.',
    },
    {
      type: 'mcq',
      prompt: 'Who CAN grant privileges on objects in a managed-access schema?',
      options: [
        'Any object owner',
        'The schema owner or a MANAGE GRANTS holder',
        'Only ACCOUNTADMIN',
        'Any role with USAGE',
      ],
      answer: 1,
      explanation: 'Grant authority is centralized to the schema owner or MANAGE GRANTS.',
    },
    {
      type: 'boolean',
      prompt: 'Enabling managed access removes the object owner\'s OWNERSHIP of their objects.',
      answer: false,
      explanation: 'Ownership stays; only the ability to grant is removed.',
    },
    {
      type: 'boolean',
      prompt: 'Managed access also governs objects created in the schema in the future.',
      answer: true,
      explanation: 'Yes — it applies to current and future objects.',
    },
    {
      type: 'mcq',
      prompt: 'What is the main security benefit of managed access?',
      options: [
        'Faster queries',
        'Object owners can\'t silently widen access',
        'It disables PUBLIC',
        'It encrypts the schema',
      ],
      answer: 1,
      explanation: 'It centralizes grant control so owners cannot quietly broaden exposure.',
    },
  ],
  references: [
    {
      label: 'Overview of Access Control',
      url: 'https://docs.snowflake.com/en/user-guide/security-access-control-overview',
    },
  ],
}
