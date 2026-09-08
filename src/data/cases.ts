import type { DiagnosisCategory } from '../scoring/types'

export type CaseInfoKey = 'demographics' | 'symptomDetails' | 'history' | 'medications' | 'riskFactors'

/**
 * The facilitator's script for the debrief.
 *
 * With nothing displayed in the room, this card is how the exercise actually
 * reaches a student. It is delivered by 22 facilitators of varying comfort with
 * acute presentations, so it has to carry someone who has not thought about
 * aortic dissection in fifteen years through a confident four minute discussion.
 * A one-line pearl does not do that.
 */
export type FacilitationCard = {
  /** The first thing the facilitator says once the timer stops. */
  opening: string
  /** How to run the round of the room. */
  roundRobin: {
    prompt: string
    /** What to do when a student says "same as theirs". */
    whenRepeated: string
  }
  /**
   * One entry per can't-miss diagnosis, in the same order as cantMissIds.
   * Two lines each: why it kills, and what should have raised it.
   */
  cantMissNotes: {
    id: string
    whyItKills: string
    whatRaisesIt: string
  }[]
  /** Questions to use when the room goes quiet. */
  probes: string[]
  /** The single most likely reasoning error on this case. */
  commonTrap: string
  /** The sixty second close. */
  close: string
}

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
  /**
   * Absent until written and reviewed. A case without a card cannot be used in
   * the pilot, because the card is the intervention.
   */
  card?: FacilitationCard
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
    card: {
      opening:
        'Four minutes, chief complaint only. Nobody had enough information, and that was the point. Let us hear what you generated.',
      roundRobin: {
        prompt:
          'Going around the room: give me one diagnosis from your list and one sentence on why you put it there. Not your best one, just the next one.',
        whenRepeated:
          'Do not let "same as theirs" pass. Ask for one nobody has said yet, or ask what they would take off their own list now that they have heard the room.',
      },
      cantMissNotes: [
        {
          id: 'acs',
          whyItKills:
            'An occluded coronary infarcts myocardium within hours. The early deaths are arrhythmia and cardiogenic shock, not the infarct itself.',
          whatRaisesIt:
            'Pressure or heaviness rather than sharpness, radiation to jaw or arm, diaphoresis, exertional onset, and the risk factor profile. Worth saying out loud: the textbook presentation is often absent in women, people with diabetes, and older patients.',
        },
        {
          id: 'pulmonary-embolism',
          whyItKills:
            'Acute right ventricular failure from a sudden rise in afterload. A large central clot can kill in minutes.',
          whatRaisesIt:
            'Pleuritic pain, dyspnea out of proportion to the exam, unexplained tachycardia, hypoxia. Risk factors are immobility, recent surgery, cancer, estrogen, and prior clot. Note that a substantial share of patients have none of them.',
        },
        {
          id: 'aortic-dissection',
          whyItKills:
            'The tear propagates. It can rupture into the pericardium and cause tamponade, shear off a coronary, or disrupt the aortic valve. Untreated mortality climbs roughly one percent per hour in the first day.',
          whatRaisesIt:
            'Abrupt pain that is maximal at onset rather than building, a tearing or ripping quality, pain that migrates, a pulse or blood pressure difference between arms, a new murmur, or any neurologic deficit alongside chest pain.',
        },
        {
          id: 'pneumothorax',
          whyItKills:
            'Under tension, trapped air shifts the mediastinum and obstructs venous return. The patient arrests from obstructive shock, not from the collapsed lung.',
          whatRaisesIt:
            'Sudden pleuritic pain with dyspnea, absent breath sounds on one side, hypotension. Think of it in tall thin young people, in COPD, after trauma, and after any procedure near the chest.',
        },
        {
          id: 'esophageal-rupture',
          whyItKills:
            'Gastric contents enter the mediastinum and cause mediastinitis. Mortality is very high and rises steeply with every hour of delay.',
          whatRaisesIt:
            'Severe pain immediately after forceful vomiting or retching, subcutaneous emphysema in the neck, recent endoscopy. Rare, and the one on this list students almost never say.',
        },
      ],
      probes: [
        'Several of you said GERD. What would have to be true for reflux to be the whole story in a 54 year old with these risk factors?',
        'Nobody said dissection. What would you need to hear on history, or find on exam, to put it on the list?',
        'Of everything on the board, which one can you least afford to be wrong about, and what is the single test that moves you?',
      ],
      commonTrap:
        'Anchoring on the known GERD. This patient has a documented reflux diagnosis and is on omeprazole, so a comfortable benign explanation is sitting right there in the chart. The trap is letting a known chronic diagnosis account for an acute presentation. Name it explicitly if the room falls into it, because they will do it again on a real patient.',
      close:
        'The move that keeps patients alive is not picking the right answer in four minutes. It is making sure the lethal handful got named before you started narrowing. You are allowed to be wrong about which one it is. You cannot afford to have never considered it.',
    },
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
