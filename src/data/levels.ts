import type { CaseInfoKey, LearnerLevel } from '../domain/types'

export type LevelConfig = {
  label: string
  shortLabel: string
  task: string
  visibleInfo: CaseInfoKey[]
  debriefFocus: string
  placeholder: string
}

export const infoLabels: Record<CaseInfoKey, string> = {
  demographics: 'Patient',
  symptomDetails: 'Symptom details',
  history: 'Medical history',
  medications: 'Current meds',
  riskFactors: 'Risk factors',
}

export const levelConfig: Record<LearnerLevel, LevelConfig> = {
  M1: {
    label: 'M1 - cold open',
    shortLabel: 'M1',
    task: 'Generate a broad differential from the chief complaint alone. Include at least one life threat.',
    visibleInfo: [],
    debriefFocus: 'Can the room name plausible causes without getting overwhelmed by case detail?',
    placeholder: 'Every cause you can think of, separated by commas',
  },
  M2: {
    label: 'M2 - organize',
    shortLabel: 'M2',
    task: 'Use the chief complaint plus basic patient context. Group causes by system or mechanism.',
    visibleInfo: ['demographics'],
    debriefFocus: 'Which diagnoses did the patient’s age and sex add or remove? Did the room adjust?',
    placeholder: 'Group by system. Cardiac: ... Pulm: ... GI: ...',
  },
  M3: {
    label: 'M3 - prioritize',
    shortLabel: 'M3',
    task: 'Add symptom details and past history. Separate most likely from most dangerous.',
    visibleInfo: ['demographics', 'symptomDetails', 'history'],
    debriefFocus: 'Can learners separate likelihood from lethality and explain their first branch point?',
    placeholder: 'Most dangerous: ... Most likely: ...',
  },
  M4: {
    label: 'M4 - synthesize',
    shortLabel: 'M4',
    task: 'Use the fuller case frame. Build a prioritized DDx with a first action or disposition concern.',
    visibleInfo: ['demographics', 'symptomDetails', 'history', 'medications', 'riskFactors'],
    debriefFocus: 'Can learners synthesize risk, meds, context, and first action without losing breadth?',
    placeholder: '1. Top diagnosis (why). 2. ... First action: ...',
  },
}
