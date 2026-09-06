import type { DiagnosisCategory } from '../scoring/types'

export type CaseInfoKey = 'demographics' | 'symptomDetails' | 'history' | 'medications' | 'riskFactors'

export type TeachingCase = {
  id: string
  label: string
  complaint: string
  learnerQuestion: string
  info: Record<CaseInfoKey, string>
  expectedCategories: DiagnosisCategory[]
  /** Registry ids, not free text. A typo here is caught by cases.test.ts. */
  cantMissIds: string[]
  importantMissIds: string[]
  pearl: string
  sampleResponses: string[]
}

/**
 * Clinical review status: DRAFT. The can't-miss and important-miss lists have
 * not yet been signed off by the three reviewing emergency physicians, and they
 * have not yet been checked against the Becoming a Physician course objectives.
 * See docs/answer-key-review.md.
 */
export const teachingCases: TeachingCase[] = [
  {
    id: 'chest-pain',
    label: 'Chest pain',
    complaint: 'A patient presents with chest pain.',
    learnerQuestion: 'What belongs on the first-pass differential?',
    info: {
      demographics: '54-year-old man',
      symptomDetails:
        'Pressure-like discomfort for 45 minutes, radiating to the left shoulder, with diaphoresis.',
      history: 'Hypertension, type 2 diabetes, GERD.',
      medications: 'Metformin, lisinopril, omeprazole.',
      riskFactors: 'Smokes one pack per day. Father had an MI at 58.',
    },
    expectedCategories: [
      'Cardiovascular',
      'Pulmonary',
      'GI / hepatobiliary',
      'Musculoskeletal',
      'Psych / behavioral',
    ],
    cantMissIds: ['acs', 'pulmonary-embolism', 'aortic-dissection', 'pneumothorax', 'esophageal-rupture'],
    importantMissIds: ['pericarditis', 'myocarditis', 'pneumonia'],
    pearl:
      'Chest pain gets safer when learners name the lethal diagnoses before they argue about the most likely one.',
    sampleResponses: [
      'ACS, PE, pneumonia, GERD, costochondritis',
      'Aortic dissection, pericarditis, pneumothorax, anxiety',
      'MI, myocarditis, pancreatitis, esophageal rupture',
    ],
  },
  {
    id: 'dyspnea',
    label: 'Shortness of breath',
    complaint: 'A patient presents with shortness of breath.',
    learnerQuestion: 'What systems could be causing this patient to feel dyspneic?',
    info: {
      demographics: '68-year-old woman',
      symptomDetails: 'Worsening dyspnea for 2 days with pleuritic discomfort and mild cough.',
      history: 'COPD, heart failure with preserved EF, recent knee replacement.',
      medications: 'Albuterol, tiotropium, furosemide, apixaban held for surgery.',
      riskFactors: 'Recent immobility, former smoker, baseline exertional dyspnea.',
    },
    expectedCategories: [
      'Pulmonary',
      'Cardiovascular',
      'Infectious',
      'Metabolic / endocrine',
      'Toxicologic',
      'Psych / behavioral',
    ],
    cantMissIds: ['pulmonary-embolism', 'acs', 'pneumothorax', 'sepsis', 'anaphylaxis'],
    importantMissIds: ['heart-failure', 'copd', 'anemia'],
    pearl:
      'Dyspnea should trigger oxygenation, ventilation, circulation, and metabolic thinking before settling on asthma or anxiety.',
    sampleResponses: [
      'Asthma, COPD, CHF, PE, pneumonia',
      'ACS, pneumothorax, sepsis, anemia',
      'Anaphylaxis, panic attack, DKA, toxic inhalation',
    ],
  },
  {
    id: 'abdominal-pain',
    label: 'Abdominal pain',
    complaint: 'A patient presents with abdominal pain.',
    learnerQuestion: 'What dangerous and common diagnoses should be on the board early?',
    info: {
      demographics: '27-year-old woman',
      symptomDetails:
        'Sharp right lower quadrant pain since this morning with nausea and one episode of emesis.',
      history: 'No prior surgeries. Last menstrual period 7 weeks ago.',
      medications: 'Prenatal vitamin as needed. No anticoagulants.',
      riskFactors: 'Sexually active, no reliable contraception, no established prenatal care.',
    },
    expectedCategories: [
      'GI / hepatobiliary',
      'Cardiovascular',
      'Infectious',
      'Renal / GU',
      'Metabolic / endocrine',
      'OB / GYN',
    ],
    cantMissIds: [
      'aaa-rupture',
      'mesenteric-ischemia',
      'ectopic-pregnancy',
      'appendicitis',
      'bowel-obstruction',
    ],
    importantMissIds: ['ovarian-torsion', 'pid', 'pyelonephritis'],
    pearl:
      'Abdominal pain rewards a wide first pass: vascular, surgical, infectious, GU, metabolic, and reproductive diagnoses all deserve room.',
    sampleResponses: [
      'Appendicitis, cholecystitis, pancreatitis, gastroenteritis',
      'AAA, mesenteric ischemia, bowel obstruction, perforated ulcer',
      'Ectopic pregnancy, ovarian torsion, kidney stone, DKA',
    ],
  },
  {
    id: 'headache',
    label: 'Headache',
    complaint: 'A patient presents with headache.',
    learnerQuestion: 'What makes this headache dangerous until proven otherwise?',
    info: {
      demographics: '35-year-old man',
      symptomDetails: 'Abrupt severe headache during exercise, maximal within minutes, with vomiting.',
      history: 'Migraines in college, no recent trauma.',
      medications: 'No daily medications.',
      riskFactors: 'Family history of aneurysm. Uses cocaine occasionally.',
    },
    expectedCategories: ['Neurologic', 'Infectious', 'Cardiovascular', 'Toxicologic', 'Other'],
    cantMissIds: ['sah', 'meningitis', 'intracranial-mass', 'cvst', 'co-poisoning'],
    importantMissIds: ['hypertensive-emergency', 'cervical-artery-dissection', 'temporal-arteritis'],
    pearl:
      'The first move is not migraine versus tension. The first move is deciding whether this could be blood, infection, pressure, vascular injury, or toxin.',
    sampleResponses: [
      'Migraine, tension headache, SAH, meningitis',
      'Intracranial mass, stroke, temporal arteritis, CO poisoning',
      'Hypertensive emergency, venous sinus thrombosis, sinusitis',
    ],
  },
  {
    id: 'syncope',
    label: 'Syncope',
    complaint: 'A patient presents after passing out.',
    learnerQuestion: 'Which diagnoses change disposition even if the patient now looks well?',
    info: {
      demographics: '72-year-old man',
      symptomDetails:
        'Brief loss of consciousness while walking upstairs, now alert with mild shortness of breath.',
      history: 'Aortic stenosis, atrial fibrillation, chronic kidney disease.',
      medications: 'Metoprolol, warfarin, torsemide.',
      riskFactors: 'No prodrome, exertional episode, anticoagulated, lives alone.',
    },
    expectedCategories: [
      'Cardiovascular',
      'Neurologic',
      'Metabolic / endocrine',
      'Toxicologic',
      'GI / hepatobiliary',
    ],
    cantMissIds: ['dysrhythmia', 'pulmonary-embolism', 'gi-bleed', 'aortic-stenosis', 'seizure'],
    importantMissIds: ['hypoglycemia', 'orthostasis', 'ich'],
    pearl:
      'Syncope should trigger a search for rhythm, pump, blood, brain, and toxin problems before accepting a benign explanation.',
    sampleResponses: [
      'Vasovagal syncope, orthostasis, dysrhythmia, PE',
      'GI bleed, seizure, hypoglycemia, intoxication',
      'Aortic stenosis, ACS, dehydration, ectopic pregnancy',
    ],
  },
]

export const infoLabels: Record<CaseInfoKey, string> = {
  demographics: 'Patient',
  symptomDetails: 'Symptom details',
  history: 'Medical history',
  medications: 'Current meds',
  riskFactors: 'Risk factors',
}
