/**
 * Auto-grading for practice exercises.
 *
 * A goal asserts that a user can (or cannot) perform an action. Grading runs
 * {@link explainAccess} against the learner's resulting model. Optional
 * least-privilege checking diffs the grants the learner added against a reference
 * minimal set, rewarding exact matches and flagging over-granting.
 */
import { explainAccess } from './explainAccess'
import { qualifiedName } from './model'
import type { AccountModel, Action, Privilege, RoleName } from './types'

export interface GradeGoal {
  description: string
  /** Username in the model whose access is evaluated. */
  user: string
  action: Action
  expect: 'allow' | 'deny'
}

export interface GrantRef {
  privilege: Privilege
  objectId: string
  grantee: RoleName
}

export interface LeastPrivilegeRef {
  /** The minimal set of grants that should be added to satisfy the goals. */
  requiredGrants: GrantRef[]
  /** Penalize any added grant beyond the required set. */
  penalizeExtra?: boolean
}

export interface GoalResult {
  description: string
  met: boolean
  summary: string
  /** The first remediation hint for an unmet "allow" goal. */
  hint?: string
}

export interface GradeResult {
  passed: boolean
  /** 0..1 overall score (goals dominate; least-privilege refines). */
  score: number
  goalResults: GoalResult[]
  leastPrivilege?: {
    extraGrants: GrantRef[]
    missingGrants: GrantRef[]
    perfect: boolean
  }
  /** Graduated hints, most useful first. */
  hints: string[]
}

function grantKey(g: GrantRef): string {
  return `${g.privilege}|${g.objectId}|${g.grantee}`
}

export function gradeExercise(
  finalModel: AccountModel,
  spec: { goals: GradeGoal[]; leastPrivilege?: LeastPrivilegeRef; baseModel?: AccountModel },
): GradeResult {
  const goalResults: GoalResult[] = []
  const hints: string[] = []

  for (const goal of spec.goals) {
    const user = finalModel.users[goal.user]
    if (!user) {
      goalResults.push({ description: goal.description, met: false, summary: `Unknown user "${goal.user}".` })
      continue
    }
    const exp = explainAccess(finalModel, user, goal.action)
    const met = goal.expect === 'allow' ? exp.allowed : !exp.allowed
    let hint: string | undefined
    if (!met && goal.expect === 'allow') {
      const firstBad = exp.links.find((l) => !l.ok)
      hint = firstBad?.fix ?? firstBad?.label
      if (hint) hints.push(`${goal.description}: ${hint}`)
    }
    if (!met && goal.expect === 'deny') {
      hints.push(`${goal.description}: access should be denied, but every link is currently satisfied.`)
    }
    goalResults.push({ description: goal.description, met, summary: exp.summary, hint })
  }

  const allGoalsMet = goalResults.every((g) => g.met)

  // ---- least-privilege analysis ----
  let leastPrivilege: GradeResult['leastPrivilege']
  let lpScore = 1
  if (spec.leastPrivilege) {
    const base = spec.baseModel
    const addedGrants: GrantRef[] = finalModel.privGrants
      .filter((g) => g.privilege !== 'OWNERSHIP')
      .filter(
        (g) =>
          !base ||
          !base.privGrants.some(
            (bg) => bg.privilege === g.privilege && bg.objectId === g.objectId && bg.grantee === g.grantee,
          ),
      )
      .map((g) => ({ privilege: g.privilege, objectId: g.objectId, grantee: g.grantee }))

    const requiredKeys = new Set(spec.leastPrivilege.requiredGrants.map(grantKey))
    const addedKeys = new Set(addedGrants.map(grantKey))

    const extraGrants = addedGrants.filter((g) => !requiredKeys.has(grantKey(g)))
    const missingGrants = spec.leastPrivilege.requiredGrants.filter((g) => !addedKeys.has(grantKey(g)))
    const perfect = extraGrants.length === 0 && missingGrants.length === 0

    leastPrivilege = { extraGrants, missingGrants, perfect }

    if (spec.leastPrivilege.penalizeExtra && extraGrants.length > 0) {
      const total = Math.max(1, addedGrants.length)
      lpScore = Math.max(0, 1 - extraGrants.length / total)
      for (const ex of extraGrants) {
        hints.push(
          `Least privilege: you granted ${ex.privilege} on ${qualifiedName(finalModel, ex.objectId)} to ${ex.grantee}, which is more than needed.`,
        )
      }
    }
  }

  // Goals are worth 80%, least-privilege refinement 20%.
  const goalScore = goalResults.length ? goalResults.filter((g) => g.met).length / goalResults.length : 1
  const score = allGoalsMet ? 0.8 + 0.2 * lpScore : 0.8 * goalScore

  return {
    passed: allGoalsMet && (!spec.leastPrivilege?.penalizeExtra || (leastPrivilege?.extraGrants.length ?? 0) === 0),
    score: Number(score.toFixed(3)),
    goalResults,
    leastPrivilege,
    hints,
  }
}
