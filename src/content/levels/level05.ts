import type { LevelContent } from '../types'

export const level05: LevelContent = {
  id: 5,
  slug: 'granting-revoking',
  title: 'Granting & Revoking',
  subtitle: 'And who is allowed to grant',
  storyBeat:
    'Grants are how access actually happens. But not every role may grant — there are exactly three ways to earn that right.',
  emoji: '🤝',
  badge: { emoji: '✍️', name: 'Grantsmith' },
  estMinutes: 13,
  sections: [
    {
      kind: 'text',
      md: 'A **grant** is the verb of access control. Everything you have modeled so far — roles, privileges, ownership — only takes effect once a `GRANT` statement wires it together. And every grant can be undone with a matching `REVOKE`.',
    },
    {
      kind: 'text',
      md: 'The `GRANT` and `REVOKE` commands look simple, but they cover four distinct jobs. Learn to recognize which family you are looking at and the rest of access control becomes far easier to read.',
    },
    { kind: 'heading', text: 'The four grant families', level: 2 },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'Privilege on an object → role',
          def: 'The workhorse. Attaches a capability like `SELECT` to a role, e.g. `GRANT SELECT ON TABLE ... TO ROLE analyst`.',
        },
        {
          term: 'Role → role (or role → user)',
          def: 'Builds the hierarchy and hands roles to accounts, e.g. `GRANT ROLE analyst TO ROLE SYSADMIN`.',
        },
        {
          term: 'Ownership transfer',
          def: 'A special case: `GRANT OWNERSHIP ON ... TO ROLE new_owner` moves the object to a new owning role.',
        },
        {
          term: 'REVOKE',
          def: 'The inverse of any of the above — removes a privilege, a role membership, or (implicitly) resets ownership.',
        },
      ],
    },
    {
      kind: 'sql',
      caption: 'The grant families',
      code: `GRANT SELECT ON TABLE sales.public.orders TO ROLE analyst WITH GRANT OPTION;
GRANT ROLE analyst TO ROLE SYSADMIN;
GRANT OWNERSHIP ON TABLE sales.public.orders TO ROLE new_owner COPY CURRENT GRANTS;
REVOKE SELECT ON TABLE sales.public.orders FROM ROLE analyst;`,
    },
    { kind: 'heading', text: 'Who is allowed to grant?', level: 2 },
    {
      kind: 'text',
      md: 'Running a `GRANT` statement is itself an authorized action. A role can grant a privilege on an object only if it satisfies **one** of exactly three independent conditions:',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        'It **owns** the object — the owning role may grant privileges on it (unless the object lives in a *managed-access* schema, where only the schema owner can grant).',
        'It holds **`MANAGE GRANTS`** — global by default, or scoped to a database or schema with the newer container-level form.',
        'It holds the privilege itself **`WITH GRANT OPTION`** — which lets it re-grant exactly that privilege.',
      ],
    },
    {
      kind: 'text',
      md: 'These three paths are independent: any one is sufficient. The demo below lets you toggle each source and watch whether a grant would succeed.',
    },
    { kind: 'widget', name: 'GrantDelegationDemo' },
    { kind: 'heading', text: 'WITH GRANT OPTION is real', level: 2 },
    {
      kind: 'text',
      md: 'When you receive a privilege `WITH GRANT OPTION`, you may pass that same privilege along to other roles. This is how you delegate granting authority for a single, specific privilege without handing over ownership or the sweeping `MANAGE GRANTS` power.',
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'A persistent myth says "Snowflake has no `WITH GRANT OPTION`." It does — and it is one of the three ways to delegate granting.',
    },
    {
      kind: 'callout',
      variant: 'info',
      md: '`MANAGE GRANTS` is *global* by default, which is exactly why SECURITYADMIN can grant on any object in the account.',
    },
  ],
  quiz: [
    {
      type: 'boolean',
      prompt: 'Snowflake supports WITH GRANT OPTION.',
      answer: true,
      explanation: 'It does — it lets a grantee re-grant that exact privilege.',
    },
    {
      type: 'multi',
      prompt: 'Which are valid ways for a role to be authorized to GRANT a privilege on an object?',
      options: [
        'It OWNS the object',
        'It holds MANAGE GRANTS',
        'It holds the privilege WITH GRANT OPTION',
        'It is granted to a user named "admin"',
      ],
      answers: [0, 1, 2],
      explanation: 'The three delegation paths are OWNERSHIP, MANAGE GRANTS, and WITH GRANT OPTION.',
    },
    {
      type: 'mcq',
      prompt: 'Which clause lets a role re-grant a privilege it received?',
      options: ['WITH ADMIN OPTION', 'WITH GRANT OPTION', 'WITH MANAGE GRANTS', 'CASCADE'],
      answer: 1,
      explanation: 'WITH GRANT OPTION on the received privilege allows re-granting.',
    },
    {
      type: 'mcq',
      prompt: 'What is the correct way to let a role grant privileges on ANY object account-wide?',
      options: [
        'Grant it OWNERSHIP of the account',
        'Grant it global MANAGE GRANTS',
        'Grant it WITH GRANT OPTION on the account',
        'Make it a secondary role',
      ],
      answer: 1,
      explanation: 'Global MANAGE GRANTS authorizes granting on any object (as SECURITYADMIN has).',
    },
    {
      type: 'fill',
      prompt: 'Complete the grant so ANALYST can re-grant SELECT to other roles:',
      before: 'GRANT SELECT ON TABLE t TO ROLE analyst ',
      after: ';',
      answers: ['WITH GRANT OPTION'],
      explanation: 'WITH GRANT OPTION lets ANALYST re-grant SELECT.',
    },
  ],
  references: [
    { label: 'GRANT … TO ROLE', url: 'https://docs.snowflake.com/en/sql-reference/sql/grant-privilege' },
  ],
}
