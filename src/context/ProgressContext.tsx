import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LEVELS } from '../content/curriculum'

interface LevelProgress {
  quizBest: number // 0..1 best quiz score
  quizDone: boolean // quiz passed at least once
  exerciseDone: boolean
}

interface ProgressState {
  version: number
  levels: Record<number, LevelProgress>
  freeExplore: boolean
}

interface ProgressCtx {
  state: ProgressState
  xp: number
  recordQuiz: (levelId: number, score: number) => void
  recordExercise: (levelId: number) => void
  isLevelComplete: (levelId: number) => boolean
  isLevelUnlocked: (levelId: number) => boolean
  completedCount: number
  earnedBadgeLevelIds: number[]
  setFreeExplore: (v: boolean) => void
  reset: () => void
}

const KEY = 'frostbyte.progress.v1'
const QUIZ_XP = 60
const EXERCISE_XP = 90
const COMPLETE_BONUS = 50
const QUIZ_PASS = 0.7

const Ctx = createContext<ProgressCtx | null>(null)

function emptyState(): ProgressState {
  return { version: 1, levels: {}, freeExplore: false }
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressState
      if (parsed && parsed.levels) return { ...emptyState(), ...parsed }
    }
  } catch {
    /* ignore */
  }
  return emptyState()
}

const orderedIds = LEVELS.map((l) => l.id)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const api = useMemo<ProgressCtx>(() => {
    const levelOf = (id: number): LevelProgress =>
      state.levels[id] ?? { quizBest: 0, quizDone: false, exerciseDone: false }

    const hasExercise = (id: number) => !!LEVELS.find((l) => l.id === id)?.exercise
    const isComplete = (id: number) => {
      const lp = levelOf(id)
      return lp.quizDone && (!hasExercise(id) || lp.exerciseDone)
    }

    const isUnlocked = (id: number) => {
      if (state.freeExplore) return true
      const idx = orderedIds.indexOf(id)
      if (idx <= 0) return true
      return isComplete(orderedIds[idx - 1])
    }

    let xp = 0
    for (const id of orderedIds) {
      const lp = levelOf(id)
      if (lp.quizDone) xp += QUIZ_XP
      if (lp.exerciseDone) xp += EXERCISE_XP
      if (isComplete(id)) xp += COMPLETE_BONUS
    }

    const completedCount = orderedIds.filter(isComplete).length
    const earnedBadgeLevelIds = orderedIds.filter(isComplete)

    return {
      state,
      xp,
      completedCount,
      earnedBadgeLevelIds,
      isLevelComplete: isComplete,
      isLevelUnlocked: isUnlocked,
      recordQuiz: (levelId, score) =>
        setState((s) => {
          const prev = s.levels[levelId] ?? { quizBest: 0, quizDone: false, exerciseDone: false }
          return {
            ...s,
            levels: {
              ...s.levels,
              [levelId]: {
                ...prev,
                quizBest: Math.max(prev.quizBest, score),
                quizDone: prev.quizDone || score >= QUIZ_PASS,
              },
            },
          }
        }),
      recordExercise: (levelId) =>
        setState((s) => {
          const prev = s.levels[levelId] ?? { quizBest: 0, quizDone: false, exerciseDone: false }
          return { ...s, levels: { ...s.levels, [levelId]: { ...prev, exerciseDone: true } } }
        }),
      setFreeExplore: (v) => setState((s) => ({ ...s, freeExplore: v })),
      reset: () => setState(emptyState()),
    }
  }, [state])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useProgress(): ProgressCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}

export const PROGRESS_CONSTANTS = { QUIZ_PASS }
