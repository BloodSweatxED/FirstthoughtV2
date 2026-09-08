import type { DiagnosisCategory, LearnerLevel } from '../scoring/types'

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
  /**
   * The first thing the facilitator says once the timer stops. Written to work
   * at every level, since the amount of information differs but the discomfort
   * of having too little does not.
   */
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
  /**
   * What changes with the amount of information the student was given.
   *
   * The dose of information is the design. An M1 who saw only age, sex, and the
   * complaint cannot be held to the same expectations as an M4 who saw
   * medications and risk factors, and the reasoning trap is different at each
   * level. A card without this is wrong for three levels out of four.
   */
  byLevel: Record<
    LearnerLevel,
    {
      /** What good looks like at this level, and what not to expect. */
      emphasis: string
      /** Probes that only make sense given what this level actually saw. */
      probes: string[]
      /** The reasoning error this particular dose of information invites. */
      trap: string
    }
  >
  /** The sixty second close. Shared across levels. */
  close: string
}

export type TeachingCase = {
  id: string
  label: string
  complaint: string
  learnerQuestion: string
  /**
   * Exactly what the student reads at each level, written out rather than
   * assembled from parts. The wording of a low-information stem does most of
   * the teaching, so it is reviewed and signed off as written.
   */
  stems: Record<LearnerLevel, string>
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
    stems: {
      M1:
        '54-year-old man with chest pain.',
      M2:
        '54-year-old man with a history of GERD, presenting with chest pain.',
      M3:
        '54-year-old man with hypertension, type 2 diabetes, and GERD, presenting with 45 minutes of pressure-like chest discomfort radiating to the left shoulder, with diaphoresis.',
      M4:
        '54-year-old man with hypertension, type 2 diabetes, and GERD, presenting with 45 minutes of pressure-like chest discomfort radiating to the left shoulder, with diaphoresis. He takes metformin, lisinopril, and omeprazole. He smokes one pack a day. His father had a myocardial infarction at 58.',
    },
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
        'Four minutes, and less information than you wanted. Nobody in this room had enough, and that was the point. Let us hear what you generated.',
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
      byLevel: {
        M1: {
          emphasis:
            'They were given an age, a sex, and three words. Reward breadth, not accuracy. A student who names six organ systems has done this task better than one who names ACS and stops. Do not expect esophageal rupture here. Name it yourself and say why it earns a place on the list.',
          probes: [
            'You knew this man was 54 and nothing else. What did the age alone do to your list, and would it have been a different list at 24?',
            'What is the single question you would ask first, and which diagnoses would the answer let you drop?',
            'Which one on the board would you least want to find out about tomorrow?',
          ],
          trap:
            'Narrowing on almost no information. Watch for the student who names one diagnosis confidently and stops. At this level the failure mode is a short list, not a wrong list, and confidence is the warning sign rather than the goal.',
        },
        M2: {
          emphasis:
            'One piece of history has been added and it is a red herring on purpose. Spend the debrief on what that single line did to the room, not on the diagnoses themselves.',
          probes: [
            'Show of hands, honestly: whose list moved GERD up because it was in the stem?',
            'What would reflux have to look like to account for chest pain in a 54 year old man?',
            'Did anyone end up with a shorter list than they would have had without the GERD? Why is that the dangerous direction?',
          ],
          trap:
            'This is the anchoring case. The reflux history is in the stem specifically to find out who lets a known chronic diagnosis explain an acute presentation. If the room takes the bait, say so plainly, because they will do exactly this on a real patient with a real chart.',
        },
        M3: {
          emphasis:
            'They now have enough to prioritize. Push for most likely and most dangerous as two separate lists, and for what test actually moves them.',
          probes: [
            'Give me your most likely and your most dangerous. If they are the same diagnosis, tell me why that is not just convenient.',
            'Pressure, radiation to the shoulder, diaphoresis. Which part of that can you explain with reflux, and which part cannot you?',
            'What is your first test, and what would a normal result genuinely rule out?',
          ],
          trap:
            'Treating a textbook ACS description as a solved problem. The presentation fits so cleanly that dissection and pulmonary embolism quietly drop off the list, and both can present exactly like this. A story that fits well is the moment to check what else fits.',
        },
        M4: {
          emphasis:
            'Full frame. Expect a prioritized list with a first action attached. Ask about disposition and timing, not only diagnosis.',
          probes: [
            'You have everything. What do you actually do in the first ten minutes, before any result comes back?',
            'His father had an MI at 58 and he smokes a pack a day. How much did that move you, and how much should it have?',
            'The ECG is unremarkable and the first troponin is negative. What is your list now, and has anything left it?',
          ],
          trap:
            'Letting risk factors do the reasoning. Risk factors shift pretest probability. They do not diagnose and they do not exclude. Patients with no risk factors still dissect their aortas, and this is the level where students start treating a risk factor list as an answer.',
        },
      },
      close:
        'The move that keeps patients alive is not picking the right answer in four minutes. It is making sure the lethal handful got named before you started narrowing. You are allowed to be wrong about which one it is. You cannot afford to have never considered it.',
    },
  },
  {
    id: 'dyspnea',
    label: 'Shortness of breath',
    complaint: 'A patient presents with shortness of breath.',
    learnerQuestion: 'What systems could be causing this patient to feel dyspneic?',
    stems: {
      M1:
        '68-year-old woman with shortness of breath.',
      M2:
        '68-year-old woman with a history of COPD, presenting with shortness of breath.',
      M3:
        '68-year-old woman with COPD, heart failure with preserved ejection fraction, and a recent knee replacement, presenting with two days of worsening dyspnea, pleuritic discomfort, and a mild cough.',
      M4:
        '68-year-old woman with COPD, heart failure with preserved ejection fraction, and a recent knee replacement, presenting with two days of worsening dyspnea, pleuritic discomfort, and a mild cough. She takes albuterol, tiotropium, and furosemide. Her apixaban was held for surgery. She is a former smoker with baseline exertional dyspnea and has been largely immobile since the operation.',
    },
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
    stems: {
      M1:
        '27-year-old woman with abdominal pain.',
      M2:
        '27-year-old woman with a history of irritable bowel syndrome, presenting with abdominal pain.',
      M3:
        '27-year-old woman with no prior surgeries, presenting with sharp right lower quadrant pain since this morning, with nausea and one episode of vomiting. Her last menstrual period was seven weeks ago.',
      M4:
        '27-year-old woman with no prior surgeries, presenting with sharp right lower quadrant pain since this morning, with nausea and one episode of vomiting. Her last menstrual period was seven weeks ago. She takes a prenatal vitamin as needed and no anticoagulants. She is sexually active without reliable contraception and has no established prenatal care.',
    },
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
    stems: {
      M1:
        '35-year-old man with a headache.',
      M2:
        '35-year-old man with a history of migraines, presenting with a headache.',
      M3:
        '35-year-old man with migraines in college and no recent trauma, presenting with an abrupt severe headache that began during exercise, reached maximum intensity within minutes, and was followed by vomiting.',
      M4:
        '35-year-old man with migraines in college and no recent trauma, presenting with an abrupt severe headache that began during exercise, reached maximum intensity within minutes, and was followed by vomiting. He takes no daily medications. There is a family history of aneurysm, and he uses cocaine occasionally.',
    },
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
    stems: {
      M1:
        '72-year-old man who passed out.',
      M2:
        '72-year-old man with a history of atrial fibrillation, who passed out.',
      M3:
        '72-year-old man with aortic stenosis, atrial fibrillation, and chronic kidney disease, who had a brief loss of consciousness while walking upstairs and is now alert with mild shortness of breath.',
      M4:
        '72-year-old man with aortic stenosis, atrial fibrillation, and chronic kidney disease, who had a brief loss of consciousness while walking upstairs and is now alert with mild shortness of breath. He takes metoprolol, warfarin, and torsemide. There was no prodrome, the episode was exertional, he is anticoagulated, and he lives alone.',
    },
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
