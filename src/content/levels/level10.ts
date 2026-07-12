import type { LevelContent } from '../types'

export const level10: LevelContent = {
  id: 10,
  slug: 'future-grants',
  title: 'Future Grants',
  subtitle: 'Access for objects that don’t exist yet',
  storyBeat:
    'New tables land in the warehouse every day. Future grants make sure the right roles can see them the moment they are created.',
  emoji: '⏳',
  badge: { emoji: '🔮', name: 'Futurist' },
  estMinutes: 12,
  sections: [
    {
      kind: 'text',
      md: 'So far every grant you have written names an object that **already exists**. But at Frostbyte Inc. new tables arrive constantly — nightly loads, ad-hoc imports, dbt models. Re-running `GRANT SELECT` after every `CREATE TABLE` does not scale, and the moment someone forgets, a role goes blind.',
    },
    {
      kind: 'text',
      md: 'A **future grant** solves this. It says: *whenever an object of this type is created here later, automatically apply this privilege to this role.* You define the rule once, and Snowflake keeps applying it as new objects appear.',
    },
    { kind: 'heading', text: 'Writing a future grant', level: 2 },
    {
      kind: 'text',
      md: 'The shape is `GRANT <priv> ON FUTURE <type>S IN {SCHEMA s | DATABASE d} TO ROLE r`. You can scope it to a single schema or to an entire database. It only ever affects objects created **after** the grant is put in place.',
    },
    {
      kind: 'sql',
      caption: 'Future grants and backfill',
      code: `GRANT SELECT ON FUTURE TABLES IN SCHEMA sales.public TO ROLE analyst;
GRANT SELECT ON FUTURE TABLES IN DATABASE sales      TO ROLE analyst; -- ignored in schemas with their own future grant

-- Backfill objects that already exist:
GRANT SELECT ON ALL TABLES IN SCHEMA sales.public TO ROLE analyst;`,
    },
    {
      kind: 'callout',
      variant: 'info',
      md: 'Future grants only affect objects created *after* the grant. Existing objects need `GRANT … ON ALL …` to be covered.',
    },
    { kind: 'heading', text: 'The precedence rule', level: 2 },
    {
      kind: 'text',
      md: 'You can define future grants at **two** levels for the same object type: on a database and on an individual schema inside it. When both exist, they do **not** add together. For a given schema, the **schema-level** future grant takes precedence and the **database-level** one is ignored there.',
    },
    {
      kind: 'deflist',
      rows: [
        {
          term: 'Only a database-level future grant exists',
          def: 'It applies to new objects in every schema of that database.',
        },
        {
          term: 'A schema also has its own future grant (same type)',
          def: 'The schema-level grant *shadows* the database-level one for that schema — only the schema rule applies there.',
        },
        {
          term: 'Other schemas without their own rule',
          def: 'Still fall back to the database-level future grant.',
        },
      ],
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'Database-level and schema-level future grants do **not** union. For a given object type, a schema-level future grant *shadows* the database-level one in that schema.',
    },
    { kind: 'heading', text: 'See it in action', level: 2 },
    {
      kind: 'text',
      md: 'Create a future grant, then watch what happens as new tables are added and as the two scopes interact. Note who ends up with access and who does not.',
    },
    { kind: 'widget', name: 'FutureGrantDemo' },
    { kind: 'heading', text: 'Who can create them', level: 2 },
    {
      kind: 'text',
      md: 'Future grants are powerful, so setting them up is privileged. Creating a future grant requires the **MANAGE GRANTS** privilege — or **ownership of the schema** when that schema uses managed access.',
    },
    {
      kind: 'list',
      items: [
        '`ON FUTURE` — applies to objects created *later*; does not touch what exists now.',
        '`ON ALL` — a one-time backfill of objects that *already* exist; does not affect future ones.',
        'Use **both** together to cover existing objects and everything created from now on.',
      ],
    },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt:
        'Both a database-level and a schema-level future SELECT grant exist for tables. Which applies to a new table in that schema?',
      options: [
        'Both combine',
        'The schema-level grant; the database-level one is ignored there',
        'The database-level grant wins',
        'Neither applies',
      ],
      answer: 1,
      explanation:
        'The schema-level future grant shadows the database-level one for that object type in that schema.',
    },
    {
      type: 'boolean',
      prompt: 'Future grants apply to objects that already exist in the schema.',
      answer: false,
      explanation: 'No — use GRANT … ON ALL <type>S to backfill existing objects.',
    },
    {
      type: 'mcq',
      prompt: 'What privilege is required to create future grants?',
      options: [
        'USAGE',
        'MANAGE GRANTS (or schema ownership in managed access)',
        'OWNERSHIP of the account',
        'CREATE TABLE',
      ],
      answer: 1,
      explanation: 'MANAGE GRANTS (or schema ownership in a managed-access schema) is required.',
    },
    {
      type: 'boolean',
      prompt:
        'A schema-level future grant and a database-level future grant for the same object type combine additively.',
      answer: false,
      explanation: 'They do not combine — the schema-level grant takes precedence.',
    },
    {
      type: 'fill',
      prompt: 'Complete the statement to auto-grant SELECT on tables created later in a schema:',
      before: 'GRANT SELECT ON ',
      after: ' TABLES IN SCHEMA sales.public TO ROLE analyst;',
      answers: ['FUTURE'],
      explanation: 'ON FUTURE TABLES IN SCHEMA applies to tables created later.',
    },
  ],
  references: [
    { label: 'GRANT … TO ROLE', url: 'https://docs.snowflake.com/en/sql-reference/sql/grant-privilege' },
  ],
}
