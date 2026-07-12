import type { LevelContent } from '../types'

export const level13: LevelContent = {
  id: 13,
  slug: 'governance',
  title: 'Governance: Masking & Row Access',
  subtitle: 'Security that layers on top of RBAC',
  storyBeat:
    'RBAC decides who reaches a table. Governance policies decide which columns and rows they actually see once they’re in.',
  emoji: '🕵️',
  badge: { emoji: '🎭', name: 'Guardian' },
  estMinutes: 12,
  sections: [
    {
      kind: 'text',
      md: 'By now you can trace the full RBAC chain: a **role** is granted access to an object, a **user** activates that role, and the query goes through. But reaching a table is not the same as seeing everything in it. At Frostbyte the `analyst` role can query `customers` — yet legal insists nobody but a compliance team should read raw email addresses, and every regional manager should only see orders from *their* region.',
    },
    {
      kind: 'text',
      md: 'That is what **governance policies** do. They sit one layer above RBAC and refine what an already-authorized role actually gets back. Two policy types do most of the work: **masking policies** transform column values, and **row access policies** filter rows.',
    },
    {
      kind: 'heading',
      text: 'Dynamic Data Masking',
      level: 2,
    },
    {
      kind: 'text',
      md: 'A **masking policy** is a schema-level object holding a SQL expression that rewrites a **column’s value** based on the querying role or session context. You attach it to a specific column, and from then on every query is evaluated through it: privileged roles see the real value, everyone else sees a masked one. Attaching (or detaching) a policy requires the **APPLY MASKING POLICY** privilege.',
    },
    {
      kind: 'callout',
      variant: 'tip',
      title: 'Tag-based masking',
      md: 'Instead of attaching a policy column by column, you can attach it to a **tag**. Every column carrying that tag then inherits the masking automatically — classify once, protect everywhere. This needs both **APPLY MASKING POLICY** and **APPLY TAG**.',
    },
    {
      kind: 'heading',
      text: 'Row Access Policies',
      level: 2,
    },
    {
      kind: 'text',
      md: 'A **row access policy** is also a schema-level object, but instead of rewriting a value it returns a boolean that decides whether a **row** is visible. It is evaluated on `SELECT`, `UPDATE`, `DELETE`, and `MERGE`, so it governs both reads and writes. Attaching one requires the **APPLY ROW ACCESS POLICY** privilege.',
    },
    {
      kind: 'sql',
      caption: 'Masking a column and filtering rows',
      code: `CREATE MASKING POLICY sales.public.email_mask AS (val string) RETURNS string ->
  CASE WHEN CURRENT_ROLE() IN ('PII_READER') THEN val ELSE '***MASKED***' END;
ALTER TABLE sales.public.customers MODIFY COLUMN email SET MASKING POLICY sales.public.email_mask;

CREATE ROW ACCESS POLICY sales.public.region_rap AS (region string) RETURNS boolean ->
  EXISTS (SELECT 1 FROM sales.public.role_region_map m
          WHERE m.role = CURRENT_ROLE() AND m.region = region);
ALTER TABLE sales.public.orders ADD ROW ACCESS POLICY sales.public.region_rap ON (region);`,
    },
    {
      kind: 'callout',
      variant: 'pitfall',
      md: 'Masking policies transform **column values**; row access policies filter **rows**. Don’t mix them up — they solve different problems.',
    },
    {
      kind: 'heading',
      text: 'Secure views and object classification',
      level: 2,
    },
    {
      kind: 'text',
      md: 'A **secure view** (`CREATE SECURE VIEW`) hides the view definition and blocks optimizer tricks that could leak underlying data through query rewriting. Secure views **compose** with the policies above: masking and row access still apply to the base tables, and the secure view adds a second wall around the logic itself. Alongside these, **object tagging** (`APPLY TAG`) classifies objects for governance, and **network policies** restrict logins by IP address.',
    },
    {
      kind: 'callout',
      variant: 'info',
      md: 'A *normal* view does not hide its definition — only a **secure** view does. Use secure views when the definition itself is sensitive.',
    },
    {
      kind: 'deflist',
      rows: [
        { term: 'Masking policy', def: 'Rewrites a **column value** per role/context. Needs **APPLY MASKING POLICY**.' },
        { term: 'Tag-based masking', def: 'A masking policy attached to a **tag**; tagged columns inherit it. Needs **APPLY MASKING POLICY** + **APPLY TAG**.' },
        { term: 'Row access policy', def: 'Filters **rows** on SELECT/UPDATE/DELETE/MERGE. Needs **APPLY ROW ACCESS POLICY**.' },
        { term: 'Secure view', def: 'Hides the view definition and prevents optimizer-based leakage; layers on top of masking and row policies.' },
      ],
    },
    {
      kind: 'callout',
      variant: 'warning',
      title: 'Governance does not replace grants',
      md: 'These policies **layer on top of** the RBAC access chain — they refine what an already-authorized role sees. A role must still be granted access to the object before any policy can narrow it down. Governance is a second gate, never the first.',
    },
  ],
  quiz: [
    {
      type: 'mcq',
      prompt: 'Which privilege is required to attach a masking policy?',
      options: ['APPLY ROW ACCESS POLICY', 'APPLY MASKING POLICY', 'MODIFY', 'OWNERSHIP'],
      answer: 1,
      explanation: 'APPLY MASKING POLICY lets a role attach/detach masking policies.',
    },
    {
      type: 'mcq',
      prompt: 'Which privilege is required to attach a row access policy?',
      options: ['APPLY MASKING POLICY', 'APPLY ROW ACCESS POLICY', 'SELECT', 'APPLY TAG'],
      answer: 1,
      explanation: 'APPLY ROW ACCESS POLICY is required for row access policies.',
    },
    {
      type: 'boolean',
      prompt: 'Masking policies filter which rows a role can see.',
      answer: false,
      explanation: 'Masking transforms column values; row access policies filter rows.',
    },
    {
      type: 'mcq',
      prompt: 'What extra protection does a SECURE view add over a normal view?',
      options: [
        'Faster performance',
        'It hides the view definition and blocks optimizer-based leakage',
        'It grants SELECT automatically',
        'It disables row policies',
      ],
      answer: 1,
      explanation: 'Secure views hide the definition and prevent optimizer-based data leakage.',
    },
    {
      type: 'boolean',
      prompt: 'Governance policies replace the need for RBAC grants.',
      answer: false,
      explanation:
        'They layer on top of the access chain — a role must still be granted access before policies refine what it sees.',
    },
  ],
  references: [
    { label: 'Column-level security', url: 'https://docs.snowflake.com/en/user-guide/security-column-intro' },
  ],
}
