export type LearnerLevel = 'M1' | 'M2' | 'M3' | 'M4'

export const ALL_LEVELS: LearnerLevel[] = ['M1', 'M2', 'M3', 'M4']

export type DiagnosisCategory =
  | 'Cardiovascular'
  | 'Pulmonary'
  | 'GI / hepatobiliary'
  | 'Neurologic'
  | 'Infectious'
  | 'Metabolic / endocrine'
  | 'Renal / GU'
  | 'Musculoskeletal'
  | 'Toxicologic'
  | 'OB / GYN'
  | 'Psych / behavioral'
  | 'Other'

export const ALL_CATEGORIES: DiagnosisCategory[] = [
  'Cardiovascular',
  'Pulmonary',
  'GI / hepatobiliary',
  'Neurologic',
  'Infectious',
  'Metabolic / endocrine',
  'Renal / GU',
  'Musculoskeletal',
  'Toxicologic',
  'OB / GYN',
  'Psych / behavioral',
  'Other',
]

/**
 * One diagnosis in the shared registry.
 *
 * `terms` are matched as whole word sequences, never as substrings. This is the
 * fix for the v1 bug where the letters "pe" inside "appendicitis" scored as a
 * pulmonary embolism and the letters "mi" inside "migraine" scored as an ACS.
 */
export type DiagnosisEntry = {
  id: string
  name: string
  category: DiagnosisCategory
  terms: string[]
}

export type Mention = {
  diagnosisId: string
  name: string
  category: DiagnosisCategory
  /** The exact term that matched, useful when auditing a disputed score. */
  matchedTerm: string
  /** True when a negation cue ("not", "doubt", "unlikely") sits just before the term. */
  negated: boolean
}

export type ParsedResponse = {
  mentions: Mention[]
  /** Distinct diagnosis ids, negated mentions included. */
  diagnosisIds: string[]
  categories: DiagnosisCategory[]
  /**
   * Fragments the student wrote that matched nothing in the registry. These are
   * shown to the instructor so the term table can be corrected during the pilot
   * instead of silently scoring a real answer as a miss.
   */
  unmatched: string[]
}
