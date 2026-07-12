/** The securable-object hierarchy, used by the interactive object tree. */

export interface ObjectNode {
  name: string
  level: 'organization' | 'account' | 'database' | 'schema'
  blurb: string
  children?: ObjectNode[]
  /** Leaf object types shown as a group under a container. */
  contains?: string[]
}

export const OBJECT_HIERARCHY: ObjectNode = {
  name: 'Organization',
  level: 'organization',
  blurb: 'The top container. Groups one or more Snowflake accounts. Managed by ORGADMIN.',
  children: [
    {
      name: 'Account',
      level: 'account',
      blurb: 'A single Snowflake account. Directly contains account-level securables.',
      contains: ['User', 'Role', 'Warehouse', 'Resource monitor', 'Integration', 'Network policy', 'Share'],
      children: [
        {
          name: 'Database',
          level: 'database',
          blurb: 'A container for schemas. You need USAGE on the database to reach anything inside it.',
          contains: ['Database role'],
          children: [
            {
              name: 'Schema',
              level: 'schema',
              blurb:
                'A container for tables, views and other schema-level objects. You need USAGE on the schema to reach its objects. Can be created WITH MANAGED ACCESS.',
              contains: [
                'Table',
                'View (incl. secure & materialized)',
                'Stage',
                'Stream',
                'Task',
                'Function / Procedure',
                'Sequence',
                'Masking policy',
                'Row access policy',
                'Tag',
              ],
            },
          ],
        },
      ],
    },
  ],
}

/** Flat classification used by the "sort the objects" exercise/quizzes. */
export const OBJECT_CLASSIFICATION: { name: string; level: ObjectNode['level'] }[] = [
  { name: 'Warehouse', level: 'account' },
  { name: 'Resource monitor', level: 'account' },
  { name: 'User', level: 'account' },
  { name: 'Role', level: 'account' },
  { name: 'Database', level: 'account' },
  { name: 'Schema', level: 'database' },
  { name: 'Database role', level: 'database' },
  { name: 'Table', level: 'schema' },
  { name: 'View', level: 'schema' },
  { name: 'Stage', level: 'schema' },
  { name: 'Stream', level: 'schema' },
  { name: 'Task', level: 'schema' },
  { name: 'Masking policy', level: 'schema' },
  { name: 'Row access policy', level: 'schema' },
]
