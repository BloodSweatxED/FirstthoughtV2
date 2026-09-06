import { diagnosisName } from './diagnoses'
import { parseResponse } from './match'
import type { DiagnosisCategory, ParsedResponse } from './types'

export type Submission = {
  id: string
  participantId: string
  text: string
  submittedAt: string
}

/** What one student produced in one rep. This is the unit of analysis. */
export type IndividualScore = {
  submissionId: string
  participantId: string
  rawText: string
  submittedAt: string
  parsed: ParsedResponse
  /** Distinct recognised diagnoses. */
  breadth: number
  /** Distinct organ system categories. */
  categoryCount: number
  cantMissNamed: string[]
  cantMissMissed: string[]
  /** Share of this case's can't-miss list that this one student named. */
  individualCoveragePct: number
}

export type CantMissTally = {
  id: string
  name: string
  namedByCount: number
  namedByPct: number
}

/**
 * Room level summary.
 *
 * Two different coverage numbers are reported on purpose. `roomCoveragePct` is
 * the union across everyone, which only ever goes up as more students submit
 * and is therefore useless for comparing groups of different sizes. It is a
 * teaching display. `meanIndividualCoveragePct` is the average of the per
 * student scores and is the number to analyse.
 */
export type RoomSummary = {
  n: number
  cantMissTally: CantMissTally[]
  categoryTally: { category: DiagnosisCategory; namedByCount: number; namedByPct: number }[]
  roomCoveragePct: number
  meanIndividualCoveragePct: number
  meanBreadth: number
  medianBreadth: number
  /** Can't-miss diagnoses nobody in the room named. The debrief list. */
  roomMissed: string[]
  /** Everything students wrote that the registry did not recognise. */
  unmatched: string[]
}

const pct = (numerator: number, denominator: number) =>
  denominator === 0 ? 0 : Math.round((numerator / denominator) * 100)

const median = (values: number[]) => {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

export const scoreSubmission = (
  submission: Submission,
  cantMissIds: string[],
): IndividualScore => {
  const parsed = parseResponse(submission.text)
  const named = cantMissIds.filter((id) => parsed.diagnosisIds.includes(id))
  const missed = cantMissIds.filter((id) => !parsed.diagnosisIds.includes(id))

  return {
    submissionId: submission.id,
    participantId: submission.participantId,
    rawText: submission.text,
    submittedAt: submission.submittedAt,
    parsed,
    breadth: parsed.diagnosisIds.length,
    categoryCount: parsed.categories.length,
    cantMissNamed: named,
    cantMissMissed: missed,
    individualCoveragePct: pct(named.length, cantMissIds.length),
  }
}

export const summarizeRoom = (
  scores: IndividualScore[],
  cantMissIds: string[],
): RoomSummary => {
  const n = scores.length

  const cantMissTally: CantMissTally[] = cantMissIds.map((id) => {
    const namedByCount = scores.filter((score) => score.cantMissNamed.includes(id)).length
    return { id, name: diagnosisName(id), namedByCount, namedByPct: pct(namedByCount, n) }
  })

  const categorySet = new Set<DiagnosisCategory>()
  scores.forEach((score) => score.parsed.categories.forEach((category) => categorySet.add(category)))

  const categoryTally = Array.from(categorySet).map((category) => {
    const namedByCount = scores.filter((score) => score.parsed.categories.includes(category)).length
    return { category, namedByCount, namedByPct: pct(namedByCount, n) }
  })

  const breadths = scores.map((score) => score.breadth)
  const coveredByAnyone = cantMissTally.filter((entry) => entry.namedByCount > 0)

  return {
    n,
    cantMissTally,
    categoryTally: categoryTally.sort((a, b) => b.namedByCount - a.namedByCount),
    roomCoveragePct: pct(coveredByAnyone.length, cantMissIds.length),
    meanIndividualCoveragePct:
      n === 0
        ? 0
        : Math.round(scores.reduce((sum, score) => sum + score.individualCoveragePct, 0) / n),
    meanBreadth: n === 0 ? 0 : Number((breadths.reduce((sum, v) => sum + v, 0) / n).toFixed(1)),
    medianBreadth: median(breadths),
    roomMissed: cantMissTally.filter((entry) => entry.namedByCount === 0).map((entry) => entry.name),
    unmatched: Array.from(new Set(scores.flatMap((score) => score.parsed.unmatched))),
  }
}
