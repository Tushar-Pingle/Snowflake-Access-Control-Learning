import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getLevelBySlug, nextLevel, prevLevel } from '../content/curriculum'
import { useProgress } from '../context/ProgressContext'
import { ContentRenderer } from '../components/ContentRenderer'
import { QuizEngine } from '../components/quiz/QuizEngine'
import { ExercisePanel } from '../components/sim/ExercisePanel'

type Tab = 'learn' | 'quiz' | 'practice'

export function LevelPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const level = slug ? getLevelBySlug(slug) : undefined
  const { recordQuiz, recordExercise, isLevelComplete, isLevelUnlocked, state } = useProgress()
  const [tab, setTab] = useState<Tab>('learn')

  useEffect(() => {
    setTab('learn')
    window.scrollTo({ top: 0 })
  }, [slug])

  const lp = level ? state.levels[level.id] : undefined
  const quizDone = !!lp?.quizDone
  const exerciseDone = !!lp?.exerciseDone

  const next = level ? nextLevel(level.id) : undefined
  const prev = level ? prevLevel(level.id) : undefined
  const complete = level ? isLevelComplete(level.id) : false

  const tabs: { key: Tab; label: string; show: boolean; done: boolean }[] = useMemo(
    () => [
      { key: 'learn', label: '📖 Learn', show: true, done: false },
      { key: 'quiz', label: '🧠 Check yourself', show: true, done: quizDone },
      { key: 'practice', label: '🧪 Practice', show: !!level?.exercise, done: exerciseDone },
    ],
    [level, quizDone, exerciseDone],
  )

  if (!level) {
    return (
      <div className="container center" style={{ padding: '4rem 0' }}>
        <h2>Mission not found</h2>
        <Link className="btn btn-primary" to="/">Back to the journey</Link>
      </div>
    )
  }

  if (!isLevelUnlocked(level.id)) {
    return (
      <div className="container center" style={{ padding: '4rem 0' }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2>Mission {level.id} is locked</h2>
        <p className="dim">Complete the previous mission first — or turn on free-explore mode on the Progress page.</p>
        <Link className="btn btn-primary" to="/">Back to the journey</Link>
      </div>
    )
  }

  return (
    <div className="container level-page">
      <div className="level-head">
        <Link to="/" className="muted" style={{ fontSize: '0.85rem' }}>← Journey</Link>
        <div className="row" style={{ gap: 10, marginTop: 6 }}>
          <span className="level-emoji" aria-hidden>{level.emoji}</span>
          <div>
            <div className="muted" style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em' }}>MISSION {level.id}</div>
            <h1 style={{ margin: 0 }}>{level.title}</h1>
            <p className="dim" style={{ margin: '2px 0 0' }}>{level.subtitle}</p>
          </div>
        </div>
        <div className="story-beat">{level.storyBeat}</div>
      </div>

      <div className="tabs">
        {tabs.filter((t) => t.show).map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} {t.done && <span className="tab-check">✓</span>}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {tab === 'learn' && (
          <>
            <ContentRenderer blocks={level.sections} />
            {level.references && level.references.length > 0 && (
              <div className="card" style={{ marginTop: 20 }}>
                <strong>Go deeper (official docs)</strong>
                <ul className="tight" style={{ marginTop: 6 }}>
                  {level.references.map((r) => (
                    <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.label}</a></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="level-cta">
              <button className="btn btn-primary" onClick={() => setTab('quiz')}>Check yourself →</button>
            </div>
          </>
        )}

        {tab === 'quiz' && (
          <>
            <QuizEngine key={slug} questions={level.quiz} onComplete={(score) => recordQuiz(level.id, score)} />
            <div className="level-cta">
              {level.exercise ? (
                <button className="btn btn-primary" onClick={() => setTab('practice')}>On to practice →</button>
              ) : next ? (
                <Link className="btn btn-primary" to={`/level/${next.slug}`}>Next mission →</Link>
              ) : null}
            </div>
          </>
        )}

        {tab === 'practice' && level.exercise && (
          <ExercisePanel key={slug} exercise={level.exercise} onSolved={() => recordExercise(level.id)} />
        )}
      </div>

      {/* Completion + navigation */}
      {complete && (
        <div className="card complete-banner">
          🏆 Mission complete! You earned the <strong>{level.badge.emoji} {level.badge.name}</strong> badge.
        </div>
      )}
      <div className="spread level-nav">
        {prev ? <Link className="btn btn-ghost" to={`/level/${prev.slug}`}>← {prev.title}</Link> : <span />}
        {next ? (
          <button className="btn btn-primary" onClick={() => navigate(`/level/${next.slug}`)}>{next.title} →</button>
        ) : (
          <Link className="btn btn-primary" to="/progress">Finish · view your progress →</Link>
        )}
      </div>
    </div>
  )
}
