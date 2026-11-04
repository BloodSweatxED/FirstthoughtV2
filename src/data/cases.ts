import type { TeachingCase } from '../domain/types'

/**
 * Answer keys are level-aware. Each level reveals more of the case, so the key changes with it.
 * Example: "AAA rupture" is a can't-miss for "a patient with abdominal pain" (M1),
 * but not once learners know the patient is a 27-year-old woman (M2 and up).
 *
 * A diagnosis that appears in the history at a level (syncope: aortic stenosis at M3)
 * moves out of can't-miss and into most-likely, because naming it is no longer a catch.
 *
 * CLINICAL REVIEW NEEDED: these keys are a first draft for faculty review, not a validated standard.
 */
export const teachingCases: TeachingCase[] = [
  {
    id: 'chest-pain',
    label: 'Chest pain',
    complaint: 'A patient presents with chest pain.',
    learnerQuestion: 'What belongs on the first-pass differential?',
    info: {
      demographics: '54-year-old man',
      symptomDetails: 'Pressure-like discomfort for 45 minutes, radiating to the left shoulder, with diaphoresis.',
      history: 'Hypertension, type 2 diabetes, GERD.',
      medications: 'Metformin, lisinopril, omeprazole.',
      riskFactors: 'Smokes one pack per day. Father had an MI at 58.',
    },
    cannotMiss: [
      { dx: 'acs' },
      { dx: 'pe' },
      { dx: 'aortic-dissection' },
      { dx: 'pneumothorax' },
      { dx: 'tamponade' },
      { dx: 'esophageal-rupture' },
    ],
    mostLikely: [
      { dx: 'chest-wall', levels: ['M1', 'M2'] },
      { dx: 'gerd' },
      { dx: 'acs' },
      { dx: 'anxiety', levels: ['M1', 'M2'] },
    ],
    alsoConsider: [
      { dx: 'pericarditis' },
      { dx: 'myocarditis' },
      { dx: 'pneumonia' },
      { dx: 'biliary', levels: ['M1', 'M2'] },
      { dx: 'pancreatitis', levels: ['M1', 'M2'] },
    ],
    pearl:
      'Chest pain gets safer when learners name the lethal diagnoses before they argue about the most likely one.',
    sampleResponses: [
      'ACS, PE, pneumonia, GERD, costochondritis',
      'Aortic dissection, pericarditis, pneumothorax, anxiety',
      '1. MI 2. myocarditis 3. pancreatitis 4. Boerhaave’s',
      'Most dangerous: STEMI, tension PTX, tamponade. Most likely: MSK, reflux',
    ],
  },
  {
    id: 'dyspnea',
    label: 'Shortness of breath',
    complaint: 'A patient presents with shortness of breath.',
    learnerQuestion: 'What systems could be causing this patient to feel short of breath?',
    info: {
      demographics: '68-year-old woman',
      symptomDetails: 'Worsening dyspnea for 2 days with pleuritic chest discomfort and mild cough.',
      history: 'COPD, heart failure with preserved EF, knee replacement 10 days ago.',
      medications: 'Albuterol, tiotropium, furosemide. Apixaban was held for surgery and not restarted.',
      riskFactors: 'Recent immobility, former smoker, baseline exertional dyspnea.',
    },
    cannotMiss: [
      { dx: 'pe' },
      { dx: 'acs' },
      { dx: 'pneumothorax' },
      { dx: 'sepsis' },
      { dx: 'anaphylaxis', levels: ['M1', 'M2'] },
      { dx: 'heart-failure', levels: ['M3', 'M4'] },
    ],
    mostLikely: [
      { dx: 'asthma', levels: ['M1'] },
      { dx: 'copd' },
      { dx: 'pneumonia' },
      { dx: 'heart-failure', levels: ['M1', 'M2'] },
      { dx: 'pe', levels: ['M3', 'M4'] },
    ],
    alsoConsider: [
      { dx: 'anemia' },
      { dx: 'dka', levels: ['M1', 'M2'] },
      { dx: 'anxiety', levels: ['M1', 'M2'] },
      { dx: 'tamponade' },
    ],
    pearl:
      'Dyspnea should trigger oxygenation, ventilation, circulation, and metabolic thinking before settling on asthma or anxiety.',
    sampleResponses: [
      'Asthma, COPD, CHF, PE, pneumonia',
      'ACS, pneumothorax, sepsis, anemia',
      'Anaphylaxis, panic attack, DKA, toxic inhalation',
      'PE’s until proven otherwise / COPD exac / PNA',
    ],
  },
  {
    id: 'abdominal-pain',
    label: 'Abdominal pain',
    complaint: 'A patient presents with abdominal pain.',
    learnerQuestion: 'What dangerous and common diagnoses should be on the board early?',
    info: {
      demographics: '27-year-old woman',
      symptomDetails: 'Sharp right lower quadrant pain since this morning with nausea and one episode of emesis.',
      history: 'No prior surgeries. Last menstrual period 7 weeks ago.',
      medications: 'Prenatal vitamin as needed. No anticoagulants.',
      riskFactors: 'Sexually active, no reliable contraception, no established prenatal care.',
    },
    cannotMiss: [
      { dx: 'ectopic' },
      { dx: 'appendicitis' },
      { dx: 'ovarian-torsion', levels: ['M2', 'M3', 'M4'] },
      { dx: 'aaa', levels: ['M1'] },
      { dx: 'mesenteric-ischemia', levels: ['M1'] },
      { dx: 'bowel-obstruction', levels: ['M1', 'M2'] },
      { dx: 'perforated-viscus', levels: ['M1', 'M2'] },
    ],
    mostLikely: [
      { dx: 'gastroenteritis', levels: ['M1', 'M2'] },
      { dx: 'appendicitis' },
      { dx: 'uti', levels: ['M1', 'M2'] },
      { dx: 'ovarian-cyst', levels: ['M2', 'M3', 'M4'] },
      { dx: 'pregnancy', levels: ['M3', 'M4'] },
    ],
    alsoConsider: [
      { dx: 'pid' },
      { dx: 'uti', levels: ['M3', 'M4'] },
      { dx: 'kidney-stone' },
      { dx: 'ovarian-torsion', levels: ['M1'] },
      { dx: 'biliary', levels: ['M1', 'M2'] },
      { dx: 'dka', levels: ['M1', 'M2'] },
    ],
    pearl:
      'Abdominal pain rewards a wide first pass. Once you know the patient can be pregnant, ectopic goes to the top until a test says otherwise.',
    sampleResponses: [
      'Appendicitis, cholecystitis, pancreatitis, gastroenteritis',
      'AAA, mesenteric ischemia, SBO, perforated ulcer',
      'Ectopic pregnancy, ovarian torsion, kidney stone, DKA',
      'r/o ectopic; appy vs ruptured cyst; PID',
    ],
  },
  {
    id: 'headache',
    label: 'Headache',
    complaint: 'A patient presents with headache.',
    learnerQuestion: 'What makes this headache dangerous until proven otherwise?',
    info: {
      demographics: '35-year-old man',
      symptomDetails: 'Abrupt severe headache during exercise, maximal within one minute, with vomiting.',
      history: 'Migraines in college, no recent trauma. Says this is different from his usual headaches.',
      medications: 'No daily medications.',
      riskFactors: 'Mother had a brain aneurysm. Uses cocaine occasionally.',
    },
    cannotMiss: [
      { dx: 'sah' },
      { dx: 'cvst' },
      { dx: 'meningitis', levels: ['M1', 'M2'] },
      { dx: 'intracranial-mass', levels: ['M1', 'M2'] },
      { dx: 'co-poisoning', levels: ['M1', 'M2'] },
      { dx: 'cervical-artery-dissection', levels: ['M3', 'M4'] },
      { dx: 'rcvs', levels: ['M3', 'M4'] },
      { dx: 'ich', levels: ['M4'] },
    ],
    mostLikely: [
      { dx: 'migraine' },
      { dx: 'tension-headache', levels: ['M1', 'M2'] },
      { dx: 'sinusitis', levels: ['M1'] },
      { dx: 'sah', levels: ['M3', 'M4'] },
    ],
    alsoConsider: [
      { dx: 'hypertensive-emergency' },
      { dx: 'cervical-artery-dissection', levels: ['M1', 'M2'] },
      { dx: 'temporal-arteritis', levels: ['M1'] },
      { dx: 'meningitis', levels: ['M3', 'M4'] },
      { dx: 'ich', levels: ['M1', 'M2', 'M3'] },
      { dx: 'iih', levels: ['M1'] },
    ],
    pearl:
      'The first move is not migraine versus tension. It is deciding whether this could be blood, infection, pressure, vascular injury, or toxin. A thunderclap onset makes the most likely and the most dangerous the same diagnosis.',
    sampleResponses: [
      'Migraine, tension headache, SAH, meningitis',
      'Intracranial mass, stroke, temporal arteritis, CO poisoning',
      'Hypertensive emergency, venous sinus thrombosis, sinusitis',
      'Thunderclap: SAH vs RCVS vs carotid dissection; cocaine',
    ],
  },
  {
    id: 'syncope',
    label: 'Syncope',
    complaint: 'A patient presents after passing out.',
    learnerQuestion: 'Which diagnoses change disposition even if the patient now looks well?',
    info: {
      demographics: '72-year-old man',
      symptomDetails: 'Brief loss of consciousness while walking upstairs, now alert with mild shortness of breath.',
      history: 'Aortic stenosis, atrial fibrillation, chronic kidney disease.',
      medications: 'Metoprolol, warfarin, torsemide.',
      riskFactors: 'No prodrome, exertional episode, anticoagulated, lives alone.',
    },
    cannotMiss: [
      { dx: 'dysrhythmia' },
      { dx: 'pe' },
      { dx: 'gi-bleed' },
      { dx: 'acs' },
      { dx: 'aortic-dissection' },
      { dx: 'aortic-stenosis', levels: ['M1', 'M2'] },
      { dx: 'ectopic', levels: ['M1'] },
      { dx: 'sah', levels: ['M1'] },
      { dx: 'ich', levels: ['M4'] },
    ],
    mostLikely: [
      { dx: 'vasovagal', levels: ['M1', 'M2'] },
      { dx: 'orthostasis', levels: ['M1', 'M2'] },
      { dx: 'dysrhythmia', levels: ['M2', 'M3', 'M4'] },
      { dx: 'aortic-stenosis', levels: ['M3', 'M4'] },
      { dx: 'medication-effect', levels: ['M4'] },
    ],
    alsoConsider: [
      { dx: 'seizure' },
      { dx: 'hypoglycemia' },
      { dx: 'hypovolemia' },
      { dx: 'orthostasis', levels: ['M3', 'M4'] },
      { dx: 'ich', levels: ['M1', 'M2', 'M3'] },
      { dx: 'electrolyte', levels: ['M3', 'M4'] },
    ],
    pearl:
      'Syncope should trigger a search for rhythm, pump, blood, brain, and toxin problems before accepting a benign explanation. Exertional syncope without a prodrome is cardiac until proven otherwise.',
    sampleResponses: [
      'Vasovagal syncope, orthostasis, dysrhythmia, PE',
      'GI bleed, seizure, hypoglycemia, intoxication',
      'Aortic stenosis, ACS, dehydration, medication side effect',
      'Arrhythmia (AFib w/ RVR, heart block), GIB on warfarin, subdural',
    ],
  },
]
