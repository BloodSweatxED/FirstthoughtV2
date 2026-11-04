import { diagnosisById } from '../data/diagnoses'
import { expectedCategoriesFor } from './answerKey'
import { matchDiagnoses, type Matcher } from './matcher'
import type { AnswerKey, DiagnosisCategory, ResponseEntry } from './types'

export type DxTally = { dx: string; name: string; count: number }

export type RoomAggregate = {
  responseCount: number
  /** How many learners named each key diagnosis. */
  cannotMiss: DxTally[]
  mostLikely: DxTally[]
  alsoConsider: DxTally[]
  /** Share of can't-miss diagnoses named by at least one learner. */
  roomCoverage: number
  /** Median share of can't-miss diagnoses each individual learner named. */
  medianLearnerCoverage: number
  categoriesNamed: DiagnosisCategory[]
  categoriesMissing: DiagnosisCategory[]
  /** Diagnoses learners named that are not in the key, with counts. */
  offKey: DxTally[]
  /** Text the matcher could not recognize. */
  unrecognized: string[]
}

const median = (values: number[]) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

const tally = (ids: string[], counts: Map<string, number>): DxTally[] =>
  ids.map((dx) => ({ dx, name: diagnosisById[dx]?.name ?? dx, count: counts.get(dx) ?? 0 }))

export const aggregateResponses = (
  responses: ResponseEntry[],
  key: AnswerKey,
  matcher: Matcher = matchDiagnoses,
): RoomAggregate => {
  const counts = new Map<string, number>()
  const unrecognized: string[] = []
  const perLearnerCoverage: number[] = []

  for (const response of responses) {
    const { matched, unrecognized: missed } = matcher(response.text)
    matched.forEach((dx) => counts.set(dx, (counts.get(dx) ?? 0) + 1))
    unrecognized.push(...missed)
    if (key.cannotMiss.length > 0) {
      const named = key.cannotMiss.filter((dx) => matched.includes(dx)).length
      perLearnerCoverage.push(named / key.cannotMiss.length)
    }
  }

  const categoriesNamed = new Set<DiagnosisCategory>()
  counts.forEach((_, dx) => diagnosisById[dx]?.categories.forEach((category) => categoriesNamed.add(category)))

  const keyed = new Set([...key.cannotMiss, ...key.mostLikely, ...key.alsoConsider])
  const offKey = tally(
    Array.from(counts.keys()).filter((dx) => !keyed.has(dx)),
    counts,
  ).sort((a, b) => b.count - a.count)

  const cannotMiss = tally(key.cannotMiss, counts)
  const namedCannotMiss = cannotMiss.filter((item) => item.count > 0).length

  return {
    responseCount: responses.length,
    cannotMiss,
    mostLikely: tally(key.mostLikely, counts),
    alsoConsider: tally(key.alsoConsider, counts),
    roomCoverage: key.cannotMiss.length ? namedCannotMiss / key.cannotMiss.length : 0,
    medianLearnerCoverage: median(perLearnerCoverage),
    categoriesNamed: Array.from(categoriesNamed),
    categoriesMissing: expectedCategoriesFor(key).filter((category) => !categoriesNamed.has(category)),
    offKey,
    unrecognized,
  }
}
