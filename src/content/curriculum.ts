import type { LevelContent } from './types'
import { ALL_LEVELS } from './levels'
import { LEVEL_EXERCISES } from './levelExercises'

/** Attach the simulator exercises (defined separately) to their levels. */
export const LEVELS: LevelContent[] = ALL_LEVELS.map((l) =>
  !l.exercise && LEVEL_EXERCISES[l.id] ? { ...l, exercise: LEVEL_EXERCISES[l.id] } : l,
)

export function getLevelBySlug(slug: string): LevelContent | undefined {
  return LEVELS.find((l) => l.slug === slug)
}

export function getLevelById(id: number): LevelContent | undefined {
  return LEVELS.find((l) => l.id === id)
}

export function levelIndex(id: number): number {
  return LEVELS.findIndex((l) => l.id === id)
}

export function nextLevel(id: number): LevelContent | undefined {
  const i = levelIndex(id)
  return i >= 0 ? LEVELS[i + 1] : undefined
}

export function prevLevel(id: number): LevelContent | undefined {
  const i = levelIndex(id)
  return i > 0 ? LEVELS[i - 1] : undefined
}

/** Total XP achievable if every level's quiz + exercise + completion bonus is earned. */
export const TOTAL_LEVELS = LEVELS.length
