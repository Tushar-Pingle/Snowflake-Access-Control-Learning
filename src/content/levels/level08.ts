import type { LevelContent } from '../types'

export const level08: LevelContent = {
  id: 8,
  slug: 'ownership-dac',
  title: 'Ownership & DAC',
  subtitle: 'Who owns what, and transferring it',
  storyBeat:
    'Every object has exactly one owner role. When people change teams, ownership has to move cleanly — without breaking access.',
  emoji: '🪪',
  badge: { emoji: '🏷️', name: 'Owner' },
  estMinutes: 12,
  sections: [
    {
      kind: 'text',
      md: 'Snowflake follows a **Discretionary Access Control (DAC)** model: every securable object has an *owner*, and the owner can decide who else may use it. But the owner is never a person — it is always a **role**. Understanding who ends up holding that ownership, and how to hand it off, is the difference between a tidy access model and a tangle of broken grants.',
    },
    {
      kind: 'text',
      md: 'The rule is refreshingly simple to state: **exactly one role owns each object.** No object is ownerless, and no object has two owners. Everything below flows from that single fact.',
    },
    { kind: 'heading', text: 'Who becomes the owner?', level: 2 },
    {
      kind: 'text',
      md: 'When you run `CREATE`, the new object is owned by your session\'s **primary** role — the single role that was active as primary at the moment of creation. Secondary roles ride along for privilege *checks*, but they cannot create objects, and therefore can never become an owner this way.',
    },
    {
      kind: 'callout',
      variant: 'info',
      md: 'CREATE always uses the **primary** role, so the new object is owned by whatever role you had active as primary — not a secondary role.',
    },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'Primary role',
          def: 'The one role set by `USE ROLE`. It is the role charged with authorizing a `CREATE`, and it becomes the new object\'s owner.',
        },
        {
          term: 'Secondary roles',
          def: 'Extra roles activated for the session. They broaden what you can *access*, but they cannot create objects and cannot become owners.',
        },
        {
          term: 'Role ownership',
          def: 'Roles are objects too — whoever creates a role owns it, and can then drop it or grant it onward.',
        },
      ],
    },
    { kind: 'heading', text: 'Transferring ownership', level: 2 },
    {
      kind: 'text',
      md: 'People change teams; objects need to follow. You move ownership with `GRANT OWNERSHIP … TO ROLE r`. The catch: if the object still has **outbound (dependent) grants** — privileges the current owner handed out to other roles — Snowflake *blocks* the transfer until you say what should happen to those grants.',
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: '`GRANT OWNERSHIP` is *blocked* when the object still has dependent grants — you must choose `COPY CURRENT GRANTS` or `REVOKE CURRENT GRANTS`.',
    },
    {
      kind: 'list',
      items: [
        '`COPY CURRENT GRANTS` — keep all existing grants in place; the **new owner** becomes their grantor going forward.',
        '`REVOKE CURRENT GRANTS` — strip every existing grant first, so the object arrives at its new owner with a clean slate.',
      ],
    },
    {
      kind: 'sql',
      caption: 'Transferring ownership',
      code: `GRANT OWNERSHIP ON TABLE sales.public.orders TO ROLE data_eng REVOKE CURRENT GRANTS;
GRANT OWNERSHIP ON ALL TABLES IN SCHEMA sales.public TO ROLE data_eng COPY CURRENT GRANTS;`,
    },
    {
      kind: 'callout',
      variant: 'warning',
      title: 'Shared databases are stricter',
      md: 'When the object lives in a **shared** database, only `COPY CURRENT GRANTS` is allowed — you cannot revoke grants as part of the transfer.',
    },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt: 'A session has primary=DEV and secondary=ALL. Which role owns a table it creates?',
      options: [
        'Whichever secondary role has CREATE TABLE',
        'DEV (the primary role)',
        'PUBLIC',
        'SYSADMIN',
      ],
      answer: 1,
      explanation: 'CREATE uses the primary role, so DEV owns the new table.',
    },
    {
      type: 'mcq',
      prompt: 'GRANT OWNERSHIP fails because dependent grants exist. What are the two ways to proceed?',
      options: [
        'CASCADE or RESTRICT',
        'COPY or REVOKE CURRENT GRANTS',
        'FORCE or IGNORE',
        'ALL or NONE',
      ],
      answer: 1,
      explanation: 'Specify COPY CURRENT GRANTS (keep) or REVOKE CURRENT GRANTS (strip).',
    },
    {
      type: 'mcq',
      prompt: 'On a shared database, which CURRENT GRANTS option is allowed for an ownership transfer?',
      options: ['REVOKE only', 'COPY only', 'Both', 'Neither'],
      answer: 1,
      explanation: 'Only COPY CURRENT GRANTS is allowed on a shared database.',
    },
    {
      type: 'boolean',
      prompt: 'A secondary role can create an object and become its owner.',
      answer: false,
      explanation: 'No — CREATE and ownership use the primary role only.',
    },
    {
      type: 'boolean',
      prompt: 'Every securable object has exactly one owning role.',
      answer: true,
      explanation: 'Ownership is singular: one owner role per object.',
    },
  ],
  references: [
    {
      label: 'GRANT OWNERSHIP',
      url: 'https://docs.snowflake.com/en/sql-reference/sql/grant-ownership',
    },
  ],
}
