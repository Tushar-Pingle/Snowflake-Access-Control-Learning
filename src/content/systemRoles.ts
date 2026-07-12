/** Verified data for Snowflake's six system-defined roles and their default hierarchy. */

export interface SystemRoleInfo {
  name: string
  tagline: string
  responsibilities: string[]
  /** Key privileges / capabilities. */
  capabilities: string[]
  /** Roles this role is granted INTO by default (its parents in the hierarchy). */
  grantedTo: string[]
  accent: string
  note?: string
}

export const SYSTEM_ROLES: SystemRoleInfo[] = [
  {
    name: 'ORGADMIN',
    tagline: 'Organization administrator',
    responsibilities: [
      'Manage operations at the organization level',
      'Create and view accounts in the organization',
      'View organization-level usage',
    ],
    capabilities: ['CREATE ACCOUNT', 'View ORGANIZATION_USAGE'],
    grantedTo: [],
    accent: '#a78bfa',
    note: 'Standalone — NOT part of the account role hierarchy and not granted to ACCOUNTADMIN.',
  },
  {
    name: 'ACCOUNTADMIN',
    tagline: 'Account super-administrator',
    responsibilities: [
      'Top of the account role hierarchy',
      'Billing, account parameters, and everything SYSADMIN + SECURITYADMIN can do',
    ],
    capabilities: ['Inherits SYSADMIN', 'Inherits SECURITYADMIN', 'Manage account parameters & billing'],
    grantedTo: [],
    accent: '#f87171',
    note: 'Use sparingly. Grant to very few users; never for routine work.',
  },
  {
    name: 'SECURITYADMIN',
    tagline: 'Security & grants administrator',
    responsibilities: [
      'Create, monitor and manage grants account-wide',
      'Manage object grants globally (holds MANAGE GRANTS)',
    ],
    capabilities: ['MANAGE GRANTS (global)', 'Inherits USERADMIN'],
    grantedTo: ['ACCOUNTADMIN'],
    accent: '#fb923c',
  },
  {
    name: 'USERADMIN',
    tagline: 'User & role administrator',
    responsibilities: ['Create and manage users', 'Create and manage roles'],
    capabilities: ['CREATE USER', 'CREATE ROLE'],
    grantedTo: ['SECURITYADMIN'],
    accent: '#fbbf24',
  },
  {
    name: 'SYSADMIN',
    tagline: 'System / objects administrator',
    responsibilities: [
      'Create warehouses, databases and all database objects',
      'Recommended parent of every custom role',
    ],
    capabilities: ['CREATE WAREHOUSE', 'CREATE DATABASE', 'Owns most objects'],
    grantedTo: ['ACCOUNTADMIN'],
    accent: '#38bdf8',
    note: 'Grant your custom roles to SYSADMIN so it can manage all objects.',
  },
  {
    name: 'PUBLIC',
    tagline: 'The everyone role',
    responsibilities: [
      'Automatically granted to every user and every role',
      'Can own objects; anything granted to it is visible to all',
    ],
    capabilities: ['Auto-granted everywhere'],
    grantedTo: ['(every role)'],
    accent: '#64748b',
  },
]

/** Default hierarchy edges as [child, parent] — the child is granted INTO the parent. */
export const DEFAULT_ROLE_EDGES: [string, string][] = [
  ['SYSADMIN', 'ACCOUNTADMIN'],
  ['SECURITYADMIN', 'ACCOUNTADMIN'],
  ['USERADMIN', 'SECURITYADMIN'],
]

export function getSystemRole(name: string): SystemRoleInfo | undefined {
  return SYSTEM_ROLES.find((r) => r.name === name)
}
