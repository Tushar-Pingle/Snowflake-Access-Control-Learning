import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LEVELS } from '../content/curriculum'
import { useProgress } from '../context/ProgressContext'

export function ProgressPage() {
  const { xp, completedCount, isLevelComplete, isLevelUnlocked, state, setFreeExplore, reset } = useProgress()
  const [confirming, setConfirming] = useState(false)
  const pct = Math.round((completedCount / LEVELS.length) * 100)

  return (
    <div className="container">
      <h1>Your progress</h1>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
        <div className="card stat"><div className="stat-num">⚡ {xp}</div><div className="muted">Experience points</div></div>
        <div className="card stat"><div className="stat-num">{completedCount}/{LEVELS.length}</div><div className="muted">Missions complete</div></div>
        <div className="card stat"><div className="stat-num">{pct}%</div><div className="muted">Course progress</div></div>
        <div className="card stat"><div className="stat-num">{completedCount}</div><div className="muted">Badges earned</div></div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="spread" style={{ marginBottom: 8 }}><strong>Overall completion</strong><span className="muted">{pct}%</span></div>
        <div className="pbar"><div className="pbar-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      <h2>Badges</h2>
      <div className="badge-grid">
        {LEVELS.map((l) => {
          const earned = isLevelComplete(l.id)
          return (
            <div key={l.id} className={`badge-card ${earned ? 'earned' : ''}`} title={l.title}>
              <div className="badge-emoji" aria-hidden>{earned ? l.badge.emoji : '🔒'}</div>
              <div className="badge-name">{l.badge.name}</div>
              <div className="muted" style={{ fontSize: '0.72rem' }}>Mission {l.id}</div>
            </div>
          )
        })}
      </div>

      <h2 style={{ marginTop: 28 }}>Missions</h2>
      <div className="stack" style={{ gap: 8 }}>
        {LEVELS.map((l) => {
          const lp = state.levels[l.id]
          const complete = isLevelComplete(l.id)
          const unlocked = isLevelUnlocked(l.id)
          return (
            <div key={l.id} className="progress-row card">
              <span className="journey-emoji" aria-hidden>{l.emoji}</span>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <strong>{l.id}. {l.title}</strong>
                  {complete && <span className="badge badge-good">Complete</span>}
                  {!unlocked && <span className="badge badge-muted">🔒 Locked</span>}
                </div>
                <div className="row" style={{ marginTop: 4 }}>
                  <span className="badge badge-muted">Quiz best: {Math.round((lp?.quizBest ?? 0) * 100)}%</span>
                  {l.exercise && <span className={`badge ${lp?.exerciseDone ? 'badge-good' : 'badge-muted'}`}>Exercise {lp?.exerciseDone ? 'solved' : 'todo'}</span>}
                </div>
              </div>
              {unlocked && <Link className="btn btn-sm" to={`/level/${l.slug}`}>{complete ? 'Review' : 'Continue'}</Link>}
            </div>
          )
        })}
      </div>

      <div className="card" style={{ marginTop: 28 }}>
        <h3 style={{ marginTop: 0 }}>Settings</h3>
        <label className="row" style={{ cursor: 'pointer', marginBottom: 14 }}>
          <input type="checkbox" checked={state.freeExplore} onChange={(e) => setFreeExplore(e.target.checked)} />
          <span><strong>Free-explore mode</strong> — unlock every mission regardless of progress.</span>
        </label>
        <div>
          {!confirming ? (
            <button className="btn btn-ghost" onClick={() => setConfirming(true)}>Reset all progress</button>
          ) : (
            <div className="row">
              <span className="dim">Erase XP, badges and progress?</span>
              <button className="btn" style={{ borderColor: 'var(--bad)', color: 'var(--bad)' }} onClick={() => { reset(); setConfirming(false) }}>Yes, reset</button>
              <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
