/** Content model for levels, quizzes, and simulator exercises. Content is authored
 *  as typed TS data so widgets, quizzes, and seed models stay type-checked. */
import type { AccountModel, GradeGoal, LeastPrivilegeRef, Op } from '../engine'

// ---------- Learn: content blocks ----------

/** Names of interactive widgets that can be embedded inside a level's content. */
export type WidgetName =
  | 'SystemRoleHierarchy'
  | 'ObjectHierarchyTree'
  | 'AccessChainDemo'
  | 'PrivilegeExplorer'
  | 'SystemRoleCards'
  | 'RoleInheritanceDemo'
  | 'GrantDelegationDemo'
  | 'ManagedAccessDemo'
  | 'FutureGrantDemo'
  | 'SecondaryRoleDemo'

export type ContentBlock =
  | { kind: 'heading'; text: string; level?: 2 | 3 }
  | { kind: 'text'; md: string }
  | { kind: 'callout'; variant: 'info' | 'warning' | 'tip' | 'pitfall'; title?: string; md: string }
  | { kind: 'sql'; code: string; caption?: string }
  | { kind: 'list'; ordered?: boolean; items: string[] }
  | { kind: 'deflist'; rows: { term: string; def: string }[] }
  | { kind: 'widget'; name: WidgetName; props?: Record<string, unknown> }

// ---------- Check yourself: quiz questions ----------

export type Question =
  | { type: 'mcq'; prompt: string; options: string[]; answer: number; explanation: string }
  | { type: 'multi'; prompt: string; options: string[]; answers: number[]; explanation: string }
  | { type: 'boolean'; prompt: string; answer: boolean; explanation: string }
  /** Items are listed in the CORRECT order; the UI shuffles them for the learner. */
  | { type: 'order'; prompt: string; items: string[]; explanation: string }
  /** Fill-in SQL: a blank sits between `before` and `after`; any of `answers` (case-insensitive) is correct. */
  | { type: 'fill'; prompt: string; before: string; after: string; answers: string[]; explanation: string }

// ---------- Do it: simulator exercise ----------

export interface Exercise {
  id: string
  title: string
  /** Story/brief shown above the sandbox (inline markdown). */
  brief: string
  /** Builds the starting account model. */
  seed: () => AccountModel
  /** Username in the model that the learner acts as. */
  actor: string
  goals: GradeGoal[]
  leastPrivilege?: LeastPrivilegeRef
  /** Optional starter SQL pre-filled in the editor. */
  starterSql?: string
  /** Graduated hints revealed on demand. */
  hints?: string[]
  /** Ops applied to the seed before the learner starts (setup the story doesn't ask them to do). */
  setupOps?: Op[]
  successMessage?: string
}

// ---------- A level ----------

export interface Badge {
  emoji: string
  name: string
}

export interface LevelContent {
  id: number
  slug: string
  title: string
  subtitle: string
  /** One-line narrative beat for the story mode. */
  storyBeat: string
  emoji: string
  badge: Badge
  estMinutes: number
  /** The "Learn" content. */
  sections: ContentBlock[]
  quiz: Question[]
  exercise?: Exercise
  /** Doc links for "go deeper". */
  references?: { label: string; url: string }[]
}
