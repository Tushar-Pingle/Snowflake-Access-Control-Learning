import type { ComponentType } from 'react'
import type { WidgetName } from '../../content/types'
import { SystemRoleHierarchy } from './SystemRoleHierarchy'
import { ObjectHierarchyTree } from './ObjectHierarchyTree'
import { AccessChainDemo } from './AccessChainDemo'
import { PrivilegeExplorer } from './PrivilegeExplorer'
import { SystemRoleCards } from './SystemRoleCards'
import { RoleInheritanceDemo } from './RoleInheritanceDemo'
import { GrantDelegationDemo } from './GrantDelegationDemo'
import { ManagedAccessDemo } from './ManagedAccessDemo'
import { FutureGrantDemo } from './FutureGrantDemo'
import { SecondaryRoleDemo } from './SecondaryRoleDemo'

export const WIDGETS: Record<WidgetName, ComponentType> = {
  SystemRoleHierarchy,
  ObjectHierarchyTree,
  AccessChainDemo,
  PrivilegeExplorer,
  SystemRoleCards,
  RoleInheritanceDemo,
  GrantDelegationDemo,
  ManagedAccessDemo,
  FutureGrantDemo,
  SecondaryRoleDemo,
}
