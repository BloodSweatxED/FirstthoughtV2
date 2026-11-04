export type LearnerLevel = 'M1' | 'M2' | 'M3' | 'M4'

export const LEARNER_LEVELS: LearnerLevel[] = ['M1', 'M2', 'M3', 'M4']

export type DiagnosisCategory =
  | 'Cardiovascular'
  | 'Pulmonary / airway'
  | 'GI / hepatobiliary'
  | 'Neurologic'
  | 'Infectious'
  | 'Metabolic / endocrine'
  | 'Hematologic'
  | 'Renal / GU'
  | 'OB / GYN'
  | 'Musculoskeletal'
  | 'Toxicologic'
  | 'Psych / behavioral'
  | 'Other'

export type Diagnosis = {
  id: string
  name: string
  categories: DiagnosisCategory[]
  /** Phrases a learner might type. Matched on whole words after normalization. */
  synonyms: string[]
}

export type CaseInfoKey = 'demographics' | 'symptomDetails' | 'history' | 'medications' | 'riskFactors'

/** One answer-key entry. Omit `levels` when the entry applies at every level. */
export type KeyEntry = {
  dx: string
  levels?: LearnerLevel[]
}

export type TeachingCase = {
  id: string
  label: string
  complaint: string
  learnerQuestion: string
  info: Record<CaseInfoKey, string>
  /** Diagnoses that change management or disposition if missed. */
  cannotMiss: KeyEntry[]
  /** The common explanations given what learners can see at that level. */
  mostLikely: KeyEntry[]
  /** Worth probing in debrief, but not a safety miss. */
  alsoConsider: KeyEntry[]
  pearl: string
  sampleResponses: string[]
}

export type AnswerKey = {
  cannotMiss: string[]
  mostLikely: string[]
  alsoConsider: string[]
}

export type ResponseEntry = {
  id: string
  learnerId: string
  text: string
  createdAt: string
}
