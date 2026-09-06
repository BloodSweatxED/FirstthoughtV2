import { diagnosisName } from '../scoring/diagnoses'
import type { IndividualScore } from '../scoring/score'

export type ExportContext = {
  sessionId: string
  /** Study arm label. Left blank outside a pilot. */
  arm: string
  caseId: string
  level: string
}

/**
 * One row per submission. This is the file the pilot analysis runs on, so the
 * raw text is kept alongside the derived scores. Anyone reviewing a disputed
 * score can read what the student actually wrote.
 */
const COLUMNS = [
  'session_id',
  'arm',
  'case_id',
  'level',
  'participant_id',
  'submitted_at',
  'raw_text',
  'n_diagnoses',
  'n_categories',
  'diagnoses',
  'categories',
  'cantmiss_named',
  'cantmiss_missed',
  'individual_coverage_pct',
  'negated_terms',
  'unmatched_text',
] as const

const escapeCell = (value: string) => {
  const needsQuotes = /[",\n\r]/.test(value)
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value
}

export const toCsv = (scores: IndividualScore[], context: ExportContext) => {
  const rows = scores.map((score) =>
    [
      context.sessionId,
      context.arm,
      context.caseId,
      context.level,
      score.participantId,
      score.submittedAt,
      score.rawText,
      String(score.breadth),
      String(score.categoryCount),
      score.parsed.diagnosisIds.map(diagnosisName).join(' | '),
      score.parsed.categories.join(' | '),
      score.cantMissNamed.map(diagnosisName).join(' | '),
      score.cantMissMissed.map(diagnosisName).join(' | '),
      String(score.individualCoveragePct),
      score.parsed.mentions
        .filter((mention) => mention.negated)
        .map((mention) => mention.name)
        .join(' | '),
      score.parsed.unmatched.join(' | '),
    ]
      .map(escapeCell)
      .join(','),
  )

  return [COLUMNS.join(','), ...rows].join('\n')
}

export const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
