import { diagnosisById } from '../data/diagnoses'
import type { AnswerKey, DiagnosisCategory, KeyEntry, LearnerLevel, TeachingCase } from './types'

const atLevel = (entries: KeyEntry[], level: LearnerLevel) =>
  entries.filter((entry) => !entry.levels || entry.levels.includes(level)).map((entry) => entry.dx)

export const answerKeyFor = (teachingCase: TeachingCase, level: LearnerLevel): AnswerKey => ({
  cannotMiss: atLevel(teachingCase.cannotMiss, level),
  mostLikely: atLevel(teachingCase.mostLikely, level),
  alsoConsider: atLevel(teachingCase.alsoConsider, level),
})

/** Categories a broad first pass should touch, derived from everything in the key. */
export const expectedCategoriesFor = (key: AnswerKey): DiagnosisCategory[] => {
  const categories = new Set<DiagnosisCategory>()
  for (const dx of [...key.cannotMiss, ...key.mostLikely, ...key.alsoConsider]) {
    diagnosisById[dx]?.categories.forEach((category) => categories.add(category))
  }
  return Array.from(categories)
}
