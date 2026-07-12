import { useMemo, useState } from 'react'
import type { Question } from '../../content/types'
import { InlineMd } from '../ui/InlineMd'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface QProps {
  question: Question
  onGraded: (correct: boolean) => void
  graded: boolean
}

function McqQuestion({ question, onGraded, graded }: QProps & { question: Extract<Question, { type: 'mcq' }> }) {
  const [choice, setChoice] = useState<number | null>(null)
  return (
    <div>
      <div className="q-options">
        {question.options.map((opt, i) => {
          const state = graded ? (i === question.answer ? 'correct' : i === choice ? 'wrong' : '') : choice === i ? 'chosen' : ''
          return (
            <button key={i} className={`q-option ${state}`} disabled={graded} onClick={() => setChoice(i)}>
              <span className="q-mark">{String.fromCharCode(65 + i)}</span>
              <span><InlineMd text={opt} /></span>
            </button>
          )
        })}
      </div>
      {!graded && (
        <button className="btn btn-primary" disabled={choice === null} onClick={() => onGraded(choice === question.answer)}>Check answer</button>
      )}
    </div>
  )
}

function MultiQuestion({ question, onGraded, graded }: QProps & { question: Extract<Question, { type: 'multi' }> }) {
  const [chosen, setChosen] = useState<Set<number>>(new Set())
  const toggle = (i: number) => setChosen((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  const isCorrect = () => {
    const ans = new Set(question.answers)
    return ans.size === chosen.size && [...ans].every((a) => chosen.has(a))
  }
  return (
    <div>
      <p className="muted" style={{ fontSize: '0.82rem' }}>Select all that apply.</p>
      <div className="q-options">
        {question.options.map((opt, i) => {
          const inAns = question.answers.includes(i)
          const state = graded ? (inAns ? 'correct' : chosen.has(i) ? 'wrong' : '') : chosen.has(i) ? 'chosen' : ''
          return (
            <button key={i} className={`q-option ${state}`} disabled={graded} onClick={() => toggle(i)}>
              <span className="q-mark">{chosen.has(i) ? '☑' : '☐'}</span>
              <span><InlineMd text={opt} /></span>
            </button>
          )
        })}
      </div>
      {!graded && <button className="btn btn-primary" disabled={chosen.size === 0} onClick={() => onGraded(isCorrect())}>Check answer</button>}
    </div>
  )
}

function BooleanQuestion({ question, onGraded, graded }: QProps & { question: Extract<Question, { type: 'boolean' }> }) {
  const [choice, setChoice] = useState<boolean | null>(null)
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        {[true, false].map((v) => {
          const state = graded ? (v === question.answer ? 'correct' : v === choice ? 'wrong' : '') : choice === v ? 'chosen' : ''
          return (
            <button key={String(v)} className={`q-option ${state}`} style={{ flex: 1 }} disabled={graded} onClick={() => setChoice(v)}>
              {v ? 'True' : 'False'}
            </button>
          )
        })}
      </div>
      {!graded && <button className="btn btn-primary" disabled={choice === null} onClick={() => onGraded(choice === question.answer)}>Check answer</button>}
    </div>
  )
}

function OrderQuestion({ question, onGraded, graded }: QProps & { question: Extract<Question, { type: 'order' }> }) {
  // items are in correct order; present a shuffled copy that the learner reorders.
  const [items, setItems] = useState<string[]>(() => {
    let s = shuffle(question.items)
    if (s.join('|') === question.items.join('|') && s.length > 1) s = shuffle(s)
    return s
  })
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    setItems((arr) => { const n = [...arr]; [n[i], n[j]] = [n[j], n[i]]; return n })
  }
  return (
    <div>
      <p className="muted" style={{ fontSize: '0.82rem' }}>Arrange in the correct order (top = first).</p>
      <div className="stack" style={{ gap: 6, marginBottom: 12 }}>
        {items.map((it, i) => {
          const correct = graded && it === question.items[i]
          const wrong = graded && it !== question.items[i]
          return (
            <div key={it} className={`q-option ${correct ? 'correct' : wrong ? 'wrong' : ''}`} style={{ justifyContent: 'space-between' }}>
              <span><span className="q-mark">{i + 1}</span> <InlineMd text={it} /></span>
              {!graded && (
                <span className="row" style={{ gap: 4 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
                </span>
              )}
            </div>
          )
        })}
      </div>
      {!graded && <button className="btn btn-primary" onClick={() => onGraded(items.join('|') === question.items.join('|'))}>Check order</button>}
    </div>
  )
}

function FillQuestion({ question, onGraded, graded }: QProps & { question: Extract<Question, { type: 'fill' }> }) {
  const [value, setValue] = useState('')
  const check = () => {
    const norm = value.trim().toUpperCase().replace(/\s+/g, ' ')
    onGraded(question.answers.some((a) => a.trim().toUpperCase().replace(/\s+/g, ' ') === norm))
  }
  return (
    <div>
      <div className="sql" style={{ marginBottom: 12 }}>
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          <code>
            {question.before}
            <input
              className="fill-input"
              value={value}
              disabled={graded}
              onChange={(e) => setValue(e.target.value)}
              placeholder="…"
              onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) check() }}
            />
            {question.after}
          </code>
        </pre>
      </div>
      {graded && <p className="muted">Accepted answer: <code>{question.answers[0]}</code></p>}
      {!graded && <button className="btn btn-primary" disabled={!value.trim()} onClick={check}>Check answer</button>}
    </div>
  )
}

function QuestionView(props: QProps) {
  switch (props.question.type) {
    case 'mcq': return <McqQuestion {...props} question={props.question} />
    case 'multi': return <MultiQuestion {...props} question={props.question} />
    case 'boolean': return <BooleanQuestion {...props} question={props.question} />
    case 'order': return <OrderQuestion {...props} question={props.question} />
    case 'fill': return <FillQuestion {...props} question={props.question} />
  }
}

export function QuizEngine({ questions, onComplete }: { questions: Question[]; onComplete: (score: number) => void }) {
  const [index, setIndex] = useState(0)
  const [graded, setGraded] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const q = questions[index]
  const total = questions.length
  const scorePct = useMemo(() => (total ? correctCount / total : 1), [correctCount, total])

  const handleGraded = (correct: boolean) => {
    setGraded(true)
    setLastCorrect(correct)
    if (correct) setCorrectCount((c) => c + 1)
  }

  const next = () => {
    if (index + 1 >= total) {
      setDone(true)
      onComplete(scorePct)
    } else {
      setIndex((i) => i + 1)
      setGraded(false)
    }
  }

  if (done) {
    const pct = Math.round(scorePct * 100)
    const passed = scorePct >= 0.7
    return (
      <div className="card quiz-summary center">
        <div className="quiz-score-ring" style={{ ['--pct' as string]: `${pct}` }}>
          <span>{pct}%</span>
        </div>
        <h3 style={{ marginTop: 12 }}>{passed ? 'Nicely done!' : 'Keep going!'}</h3>
        <p className="dim">You answered {correctCount} of {total} correctly.</p>
        <button className="btn" onClick={() => { setIndex(0); setGraded(false); setCorrectCount(0); setDone(false) }}>Retake quiz</button>
      </div>
    )
  }

  return (
    <div className="card quiz">
      <div className="spread" style={{ marginBottom: 10 }}>
        <span className="badge badge-muted">Question {index + 1} / {total}</span>
        <div className="pbar" style={{ width: 140 }}><div className="pbar-fill" style={{ width: `${(index / total) * 100}%` }} /></div>
      </div>
      <h3 className="q-prompt"><InlineMd text={q.prompt} /></h3>
      <QuestionView question={q} graded={graded} onGraded={handleGraded} />
      {graded && (
        <div className={`q-feedback ${lastCorrect ? 'ok' : 'bad'}`}>
          <strong>{lastCorrect ? '✓ Correct' : '✕ Not quite'}</strong>
          <p style={{ margin: '6px 0 0' }}><InlineMd text={q.explanation} /></p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={next}>{index + 1 >= total ? 'See results' : 'Next question'}</button>
        </div>
      )}
    </div>
  )
}
