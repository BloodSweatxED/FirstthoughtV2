import type { SessionResponse } from '../backend/types'
import { teachingCases } from '../data/cases'
import { diagnosisById } from '../data/diagnoses'
import { aggregateResponses, median, type RoomAggregate } from './aggregate'
import { answerKeyFor } from './answerKey'
import { matchDiagnoses } from './matcher'
import { isOpenRound, localDate } from './rounds'
import { LEARNER_LEVELS, type LearnerLevel, type TeachingCase } from './types'

/** Rehearsal answers added from the host screen carry this prefix so they can be told apart from learners. */
export const SAMPLE_LEARNER_PREFIX = 'sample-'
export const isSampleLearner = (learnerId: string) => learnerId.startsWith(SAMPLE_LEARNER_PREFIX)

export type RoundSummary = {
  roundId: string
  teachingCase: TeachingCase
  level: LearnerLevel
  mode: 'led' | 'open'
  /** ISO time of the first answer. */
  startedAt: string
  aggregate: RoomAggregate
}

export type SessionSummary = {
  rounds: RoundSummary[]
  responseCount: number
  sampleCount: number
  /** Can't-miss diagnoses across all rounds, and how many the room named. */
  cannotMissTotal: number
  cannotMissNamed: number
  /** The median answer's share of its round's can't-miss diagnoses. */
  medianLearnerCoverage: number
  /** Share of answers that named at least one can't-miss diagnosis. */
  anyCannotMissShare: number
  distinctDiagnoses: number
}

const caseById = (id: string) => teachingCases.find((item) => item.id === id)
const asLevel = (value: string): LearnerLevel | null =>
  (LEARNER_LEVELS as string[]).includes(value) ? (value as LearnerLevel) : null

/** Calendar dates (in this device's time zone) that have answers, newest first. */
export const sessionDates = (responses: SessionResponse[]) =>
  Array.from(new Set(responses.map((item) => localDate(new Date(item.createdAt)))))
    .sort()
    .reverse()

export const responsesOn = (responses: SessionResponse[], date: string) =>
  responses.filter((item) => localDate(new Date(item.createdAt)) === date)

/** Groups answers into rounds and scores each round against its level's key. */
export const summarizeSession = (responses: SessionResponse[]): SessionSummary => {
  const byRound = new Map<string, SessionResponse[]>()
  for (const response of responses) {
    byRound.set(response.roundId, [...(byRound.get(response.roundId) ?? []), response])
  }

  const rounds: RoundSummary[] = []
  for (const [roundId, items] of byRound) {
    const teachingCase = caseById(items[0].caseId)
    const level = asLevel(items[0].level)
    // Answers for a case or level this build no longer knows cannot be scored. Leave them out.
    if (!teachingCase || !level) continue
    const sorted = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    rounds.push({
      roundId,
      teachingCase,
      level,
      mode: isOpenRound(roundId) ? 'open' : 'led',
      startedAt: sorted[0].createdAt,
      aggregate: aggregateResponses(sorted, answerKeyFor(teachingCase, level)),
    })
  }
  rounds.sort((a, b) => a.startedAt.localeCompare(b.startedAt))

  const scoredIds = new Set(rounds.map((round) => round.roundId))
  const scored = responses.filter((item) => scoredIds.has(item.roundId))
  const coverage = rounds.flatMap((round) => round.aggregate.learnerCoverage)
  const named = new Set<string>()
  for (const response of scored) matchDiagnoses(response.text).matched.forEach((dx) => named.add(dx))

  return {
    rounds,
    responseCount: scored.length,
    sampleCount: scored.filter((item) => isSampleLearner(item.learnerId)).length,
    cannotMissTotal: rounds.reduce((sum, round) => sum + round.aggregate.cannotMiss.length, 0),
    cannotMissNamed: rounds.reduce(
      (sum, round) => sum + round.aggregate.cannotMiss.filter((item) => item.count > 0).length,
      0,
    ),
    medianLearnerCoverage: median(coverage),
    anyCannotMissShare: coverage.length ? coverage.filter((value) => value > 0).length / coverage.length : 0,
    distinctDiagnoses: named.size,
  }
}

const CSV_COLUMNS = [
  'time',
  'round',
  'mode',
  'case',
  'level',
  'learner',
  'sample',
  'answer',
  'matched',
  'cannot_miss_named',
  'cannot_miss_total',
  'unrecognized',
]

/** Quote every cell, and defuse anything a spreadsheet would run as a formula. */
const csvCell = (value: string | number) => {
  const text = String(value)
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

/** One row per answer, with what the matcher read it as. Opens in Excel or Sheets. */
export const sessionCsv = (responses: SessionResponse[]) => {
  const rows = [...responses]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((response) => {
      const teachingCase = caseById(response.caseId)
      const level = asLevel(response.level)
      const key = teachingCase && level ? answerKeyFor(teachingCase, level) : null
      const { matched, unrecognized } = matchDiagnoses(response.text)
      return [
        response.createdAt,
        response.roundId,
        isOpenRound(response.roundId) ? 'self-run' : 'instructor-led',
        teachingCase?.label ?? response.caseId,
        response.level,
        response.learnerId,
        isSampleLearner(response.learnerId) ? 'yes' : 'no',
        response.text,
        matched.map((dx) => diagnosisById[dx]?.name ?? dx).join('; '),
        key ? key.cannotMiss.filter((dx) => matched.includes(dx)).length : '',
        key ? key.cannotMiss.length : '',
        unrecognized.join('; '),
      ]
        .map(csvCell)
        .join(',')
    })
  return [CSV_COLUMNS.map(csvCell).join(','), ...rows].join('\r\n')
}
