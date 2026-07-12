import type { LevelContent } from '../types'

export const level06: LevelContent = {
  id: 6,
  slug: 'role-hierarchy',
  title: 'Role Hierarchy & Inheritance',
  subtitle: 'How privileges flow through the graph',
  storyBeat:
    'Roles can be granted to other roles, forming a graph. Understanding which way privileges flow is the key to scaling access.',
  emoji: '🌳',
  badge: { emoji: '🧬', name: 'Inheritor' },
  estMinutes: 12,
  sections: [
    {
      kind: 'text',
      md: 'So far you have granted privileges to a role, and granted that role to users. But roles can also be granted to **other roles**. When you do that, the roles link together into a graph — and privileges start to *flow* along its edges.',
    },
    {
      kind: 'text',
      md: 'Getting the *direction* of that flow right is the single most important idea in Snowflake access control. Get it right and access scales effortlessly; get it backwards and you will grant the same privileges over and over, wondering why nothing works.',
    },
    {
      kind: 'heading',
      text: 'Roles form a DAG',
      level: 2,
    },
    {
      kind: 'text',
      md: 'Because a role can be granted to another role, the roles form a **directed acyclic graph** (DAG): each grant is a directed edge from a child role into a parent role. "Acyclic" means you can never form a loop — Snowflake rejects a grant that would create a **cycle** (for example, `A` into `B` and then `B` back into `A`).',
    },
    {
      kind: 'deflist',
      rows: [
        { term: 'Child role', def: 'The role being **granted into** another. It supplies its privileges upward.' },
        { term: 'Parent role', def: 'The role that **receives** a child grant. It inherits everything the child can do.' },
        { term: 'DAG', def: 'A directed acyclic graph — roles connected by grants, with no cycles allowed.' },
      ],
    },
    {
      kind: 'heading',
      text: 'Privileges flow UP',
      level: 2,
    },
    {
      kind: 'text',
      md: 'A **parent** role inherits **all** privileges of every role granted into it. Privileges flow *up* the graph, toward parents. So if you grant a well-provisioned role into a parent, the parent instantly gains everything that role can do — no re-granting of individual privileges required.',
    },
    {
      kind: 'sql',
      caption: 'Privileges flow upward through the hierarchy',
      code: `GRANT SELECT ON TABLE sales.public.orders TO ROLE analyst;
-- Granting analyst INTO data_lead gives data_lead that SELECT too:
GRANT ROLE analyst TO ROLE data_lead;`,
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'Inheritance flows **up**, not down. Granting `analyst` into `data_lead` gives *data_lead* analyst’s privileges — it does **not** give analyst data_lead’s privileges.',
    },
    {
      kind: 'text',
      md: 'This is exactly how the access chain scales. Build an `analyst` role with the day-to-day SELECT access it needs, then grant `analyst` into `data_lead`. Instantly `data_lead` can do everything an analyst can, *plus* whatever extra privileges it holds on its own. Add a new table grant to `analyst` later, and `data_lead` picks it up automatically.',
    },
    {
      kind: 'widget',
      name: 'RoleInheritanceDemo',
    },
    {
      kind: 'heading',
      text: 'Anchor your roles under SYSADMIN',
      level: 2,
    },
    {
      kind: 'text',
      md: 'The same upward flow is why Snowflake recommends granting your custom roles into `SYSADMIN`. Once `SYSADMIN` sits at the top of your custom hierarchy, it inherits every privilege those roles hold and can therefore manage every object they create.',
    },
    {
      kind: 'callout',
      variant: 'tip',
      md: 'Grant your custom roles into `SYSADMIN` so SYSADMIN inherits (and can manage) everything they can do.',
    },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt: 'In the role hierarchy, privileges flow toward…',
      options: ['Child roles', 'Parent roles', 'Users only', 'Peer roles'],
      answer: 1,
      explanation: 'A parent inherits the privileges of roles granted into it — privileges flow upward.',
    },
    {
      type: 'boolean',
      prompt: 'Granting ANALYST into DATA_LEAD gives DATA_LEAD all of ANALYST’s privileges.',
      answer: true,
      explanation: 'DATA_LEAD (the parent) inherits ANALYST’s privileges.',
    },
    {
      type: 'mcq',
      prompt: 'The Snowflake role structure is best described as a…',
      options: ['Single flat list', 'DAG (directed acyclic graph)', 'Binary tree only', 'Circular chain'],
      answer: 1,
      explanation: 'Roles form a directed acyclic graph.',
    },
    {
      type: 'boolean',
      prompt: 'Granting ANALYST into DATA_LEAD also gives ANALYST all of DATA_LEAD’s privileges.',
      answer: false,
      explanation: 'No — inheritance is one-directional. Only the parent (DATA_LEAD) inherits.',
    },
    {
      type: 'mcq',
      prompt: 'Why grant custom roles into SYSADMIN?',
      options: [
        'To hide them from users',
        'So SYSADMIN inherits and can manage everything they can do',
        'To make them secondary roles',
        'It is required syntax',
      ],
      answer: 1,
      explanation: 'Anchoring custom roles under SYSADMIN keeps all objects manageable by SYSADMIN.',
    },
  ],
  references: [
    {
      label: 'Access control considerations',
      url: 'https://docs.snowflake.com/en/user-guide/security-access-control-considerations',
    },
  ],
}
