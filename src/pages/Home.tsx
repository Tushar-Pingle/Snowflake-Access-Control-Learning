import { Link } from 'react-router-dom'
import { LEVELS } from '../content/curriculum'
import { useProgress } from '../context/ProgressContext'
import { Snowflake } from '../components/ui/Snowflake'

export function Home() {
  const { isLevelComplete, isLevelUnlocked, xp, completedCount, state } = useProgress()
  const firstIncomplete = LEVELS.find((l) => !isLevelComplete(l.id))
  const pctDone = Math.round((completedCount / LEVELS.length) * 100)

  return (
    <div className="container">
      {/* Hero */}
      <section className="hero">
        <div className="hero-flakes" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="flake" style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 7) * 0.9}s`, animationDuration: `${9 + (i % 5) * 2}s` }}>
              ❄
            </span>
          ))}
        </div>
        <div className="hero-content">
          <span className="badge">❄ Interactive course · story mode</span>
          <h1>Master Snowflake<br />Access Control</h1>
          <p className="hero-lede">
            Learn roles, privileges, grants, ownership, the access chain and governance — by <strong>doing</strong>. Play through
            {' '}{LEVELS.length} bite-sized missions with live diagrams, quizzes, and a hands-on RBAC simulator that grades your grants.
          </p>
          <div className="row" style={{ marginTop: 8 }}>
            <Link className="btn btn-primary btn-lg" to={`/level/${(firstIncomplete ?? LEVELS[0]).slug}`}>
              {completedCount === 0 ? 'Start the journey' : completedCount === LEVELS.length ? 'Review levels' : 'Continue where you left off'}
            </Link>
            <Link className="btn btn-lg btn-ghost" to="/sandbox">Open the sandbox</Link>
          </div>
          <div className="hero-stats">
            <div><strong>{xp}</strong><span>XP earned</span></div>
            <div><strong>{completedCount}/{LEVELS.length}</strong><span>missions done</span></div>
            <div><strong>{pctDone}%</strong><span>complete</span></div>
          </div>
        </div>
      </section>

      {/* Journey map */}
      <section style={{ marginTop: '2.5rem' }}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Your journey</h2>
          {state.freeExplore && <span className="badge badge-warn">Free-explore on — all levels unlocked</span>}
        </div>
        <div className="journey">
          {LEVELS.map((level, i) => {
            const complete = isLevelComplete(level.id)
            const unlocked = isLevelUnlocked(level.id)
            const status = complete ? 'complete' : unlocked ? 'open' : 'locked'
            const inner = (
              <>
                <div className="journey-num">{level.id}</div>
                <div className="journey-emoji" aria-hidden>{level.emoji}</div>
                <div className="journey-body">
                  <div className="journey-title">{level.title}</div>
                  <div className="journey-sub">{level.subtitle}</div>
                  <div className="row" style={{ marginTop: 6 }}>
                    <span className="badge badge-muted">{level.estMinutes} min</span>
                    {complete && <span className="badge badge-good">✓ {level.badge.emoji} {level.badge.name}</span>}
                    {!unlocked && <span className="badge badge-muted">🔒 Locked</span>}
                  </div>
                </div>
              </>
            )
            return unlocked ? (
              <Link key={level.id} to={`/level/${level.slug}`} className={`journey-node ${status}`} style={{ animationDelay: `${i * 0.03}s` }}>
                {inner}
              </Link>
            ) : (
              <div key={level.id} className={`journey-node ${status}`} title="Complete the previous mission to unlock">
                {inner}
              </div>
            )
          })}
        </div>
      </section>

      <section className="why-grid">
        <div className="card">
          <Snowflake size={26} />
          <h3>Concept-first, then hands-on</h3>
          <p className="dim">Each mission explains the idea with visuals, checks your understanding, then drops you into a simulator to prove it.</p>
        </div>
        <div className="card">
          <div style={{ fontSize: 26 }}>🧪</div>
          <h3>A real RBAC engine</h3>
          <p className="dim">The simulator models roles, grants, ownership, managed access and future grants — and explains exactly why access is allowed or denied.</p>
        </div>
        <div className="card">
          <div style={{ fontSize: 26 }}>✅</div>
          <h3>Verified against the docs</h3>
          <p className="dim">Every rule — the access chain, the role hierarchy, WITH GRANT OPTION, future-grant precedence — is checked against Snowflake’s documentation.</p>
        </div>
      </section>
    </div>
  )
}
