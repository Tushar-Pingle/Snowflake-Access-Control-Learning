import { describe, it, expect } from 'vitest'
import { applyOps, parseSql, gradeExercise, type AccountModel } from '../engine'
import { LEVELS } from './curriculum'
import type { Exercise } from './types'

/** Reproduce ExercisePanel's base model = seed + setup ops (no auth enforcement). */
function baseModel(ex: Exercise): AccountModel {
  const seed = ex.seed()
  if (!ex.setupOps?.length) return seed
  return applyOps(seed, ex.actor, ex.setupOps, { enforceGrantAuth: false }).model
}

/** A known-correct solution (SQL) for each level's exercise, keyed by level id. */
const SOLUTIONS: Record<number, string> = {
  5: `GRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE LEAD WITH GRANT OPTION;`,
  6: `GRANT ROLE ANALYST TO ROLE DATA_LEAD;`,
  7: `
    GRANT USAGE ON WAREHOUSE ANALYTICS_WH TO ROLE ANALYST;
    GRANT USAGE ON DATABASE SALES TO ROLE ANALYST;
    GRANT USAGE ON SCHEMA SALES.PUBLIC TO ROLE ANALYST;
    GRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE ANALYST;`,
  8: `GRANT OWNERSHIP ON TABLE SALES.PUBLIC.ORDERS TO ROLE DATA_ENG COPY CURRENT GRANTS;`,
  9: `GRANT SELECT ON TABLE SALES.SECURE.ORDERS TO ROLE ANALYST;`,
  12: `
    GRANT USAGE ON WAREHOUSE ANALYTICS_WH TO ROLE SALES_READ;
    GRANT USAGE ON DATABASE SALES TO ROLE SALES_READ;
    GRANT USAGE ON SCHEMA SALES.PUBLIC TO ROLE SALES_READ;
    GRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE SALES_READ;
    GRANT ROLE SALES_READ TO ROLE ANALYST;`,
  15: `
    GRANT USAGE ON WAREHOUSE ANALYTICS_WH TO ROLE SALES_READ;
    GRANT USAGE ON DATABASE SALES TO ROLE SALES_READ;
    GRANT USAGE ON SCHEMA SALES.PUBLIC TO ROLE SALES_READ;
    GRANT SELECT ON TABLE SALES.PUBLIC.ORDERS TO ROLE SALES_READ;
    GRANT SELECT ON TABLE SALES.PUBLIC.CUSTOMERS TO ROLE SALES_READ;
    GRANT USAGE ON WAREHOUSE ANALYTICS_WH TO ROLE SALES_WRITE;
    GRANT USAGE ON DATABASE SALES TO ROLE SALES_WRITE;
    GRANT USAGE ON SCHEMA SALES.PUBLIC TO ROLE SALES_WRITE;
    GRANT INSERT ON TABLE SALES.PUBLIC.ORDERS TO ROLE SALES_WRITE;
    GRANT ROLE SALES_READ TO ROLE ANALYST;
    GRANT ROLE SALES_WRITE TO ROLE DATA_ENGINEER;`,
}

const levelsWithExercises = LEVELS.filter((l) => l.exercise)

describe('every exercise is solvable and grades as passed', () => {
  it('has a known solution for each level exercise', () => {
    for (const level of levelsWithExercises) {
      expect(SOLUTIONS[level.id], `missing solution for level ${level.id}`).toBeDefined()
    }
  })

  for (const level of levelsWithExercises) {
    it(`level ${level.id} — "${level.exercise!.title}" is solved by its reference solution`, () => {
      const ex = level.exercise!
      const base = baseModel(ex)
      const solution = SOLUTIONS[level.id]
      const { ops, errors: parseErrors } = parseSql(base, solution)
      expect(parseErrors, `parse errors: ${JSON.stringify(parseErrors)}`).toHaveLength(0)
      const { model, errors: applyErrors } = applyOps(base, ex.actor, ops)
      expect(applyErrors, `apply errors: ${JSON.stringify(applyErrors)}`).toHaveLength(0)
      const result = gradeExercise(model, { goals: ex.goals, leastPrivilege: ex.leastPrivilege, baseModel: base })
      expect(result.passed, `goals: ${JSON.stringify(result.goalResults, null, 2)}`).toBe(true)
      // If least-privilege scoring is enforced, the reference solution should be perfect.
      if (ex.leastPrivilege?.penalizeExtra) {
        expect(result.leastPrivilege?.extraGrants ?? [], `extra grants: ${JSON.stringify(result.leastPrivilege?.extraGrants)}`).toHaveLength(0)
      }
    })
  }
})
