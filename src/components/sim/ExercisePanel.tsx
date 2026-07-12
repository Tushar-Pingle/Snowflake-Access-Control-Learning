import { useMemo, useState } from 'react'
import {
  applyOps,
  explainAccess,
  gradeExercise,
  parseSql,
  type AccountModel,
} from '../../engine'
import type { Exercise } from '../../content/types'
import { InlineMd } from '../ui/InlineMd'
import { AccessChainViz } from './AccessChainViz'
import { GrantBuilder } from './GrantBuilder'

/** Builds the base model = seed + setup ops (applied without auth enforcement). */
function baseModel(exercise: Exercise): AccountModel {
  const seed = exercise.seed()
  if (!exercise.setupOps?.length) return seed
  return applyOps(seed, exercise.actor, exercise.setupOps, { enforceGrantAuth: false }).model
}

export function ExercisePanel({ exercise, onSolved }: { exercise: Exercise; onSolved: () => void }) {
  const base = useMemo(() => baseModel(exercise), [exercise])
  const [sql, setSql] = useState(exercise.starterSql ?? '')
  const [current, setCurrent] = useState<AccountModel>(base)
  const [errors, setErrors] = useState<string[]>([])
  const [ran, setRan] = useState(false)
  const [hintsShown, setHintsShown] = useState(0)
  const [graded, setGraded] = useState<ReturnType<typeof gradeExercise> | null>(null)

  const run = () => {
    const { ops, errors: parseErrors } = parseSql(base, sql)
    const { model, errors: applyErrors } = applyOps(base, exercise.actor, ops)
    setCurrent(model)
    setErrors([
      ...parseErrors.map((e) => `Parse: "${e.statement}" — ${e.error}`),
      ...applyErrors.map((e) => `Statement ${e.index + 1}: ${e.error}`),
    ])
    setRan(true)
    setGraded(null)
  }

  const grade = () => {
    const result = gradeExercise(current, { goals: exercise.goals, leastPrivilege: exercise.leastPrivilege, baseModel: base })
    setGraded(result)
    if (result.passed) onSolved()
  }

  const reset = () => {
    setSql(exercise.starterSql ?? '')
    setCurrent(base)
    setErrors([])
    setRan(false)
    setGraded(null)
    setHintsShown(0)
  }

  const goalExplanations = useMemo(
    () =>
      exercise.goals.map((g) => {
        const user = current.users[g.user]
        return { goal: g, exp: user ? explainAccess(current, user, g.action) : null }
      }),
    [current, exercise.goals],
  )

  return (
    <div className="exercise">
      <div className="callout callout-info" style={{ marginTop: 0 }}>
        <div className="callout-title"><span>🎯</span> Your mission</div>
        <p style={{ marginBottom: 0 }}><InlineMd text={exercise.brief} /></p>
      </div>

      <div className="grid exercise-grid">
        <div className="stack">
          <div className="card">
            <div className="spread" style={{ marginBottom: 8 }}>
              <strong>Worksheet</strong>
              <span className="muted" style={{ fontSize: '0.78rem' }}>acting as <code>{exercise.actor}</code></span>
            </div>
            <GrantBuilder model={base} onInsert={(stmt) => setSql((s) => (s ? `${s.replace(/\s*$/, '')}\n${stmt};` : `${stmt};`))} />
            <textarea
              className="sql-editor"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
              placeholder="-- Write GRANT / USE statements here, then Run."
              rows={7}
            />
            <div className="row">
              <button className="btn btn-primary" onClick={run}>▶ Run worksheet</button>
              <button className="btn" onClick={grade} disabled={!ran}>Grade my solution</button>
              <button className="btn btn-ghost" onClick={reset}>Reset</button>
              {exercise.hints && exercise.hints.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setHintsShown((h) => Math.min(h + 1, exercise.hints!.length))}>
                  💡 Hint ({hintsShown}/{exercise.hints.length})
                </button>
              )}
            </div>
            {errors.length > 0 && (
              <div className="q-feedback bad" style={{ marginTop: 10 }}>
                {errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            {hintsShown > 0 && (
              <div className="stack" style={{ gap: 6, marginTop: 10 }}>
                {exercise.hints!.slice(0, hintsShown).map((h, i) => (
                  <div key={i} className="callout callout-tip" style={{ margin: 0 }}><InlineMd text={h} /></div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <strong>Goals</strong>
            <div className="stack" style={{ gap: 14, marginTop: 10 }}>
              {goalExplanations.map(({ goal, exp }, i) => {
                const met = exp ? (goal.expect === 'allow' ? exp.allowed : !exp.allowed) : false
                return (
                  <div key={i}>
                    <div className={`goal-head ${met ? 'ok' : 'bad'}`}>
                      <span>{met ? '✓' : '○'}</span> {goal.description}
                    </div>
                    {ran && exp && <div style={{ marginTop: 8 }}><AccessChainViz explanation={exp} /></div>}
                  </div>
                )
              })}
            </div>
          </div>

          {graded && (
            <div className={`card ${graded.passed ? 'graded-pass' : 'graded-fail'}`}>
              <h3 style={{ margin: 0 }}>{graded.passed ? '🏆 Solved!' : 'Not yet — keep going'}</h3>
              <p className="dim">Score: {Math.round(graded.score * 100)}%</p>
              {graded.passed && exercise.successMessage && <p><InlineMd text={exercise.successMessage} /></p>}
              {graded.leastPrivilege && !graded.leastPrivilege.perfect && graded.leastPrivilege.extraGrants.length > 0 && (
                <p className="muted">You granted more than the minimum needed — tighten it for a perfect least-privilege score.</p>
              )}
              {graded.hints.length > 0 && !graded.passed && (
                <ul className="tight">
                  {graded.hints.slice(0, 4).map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
