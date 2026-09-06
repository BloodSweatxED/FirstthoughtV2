import type { DiagnosisEntry } from './types'

/**
 * The shared diagnosis registry.
 *
 * Every term here is matched as a whole word sequence. Add a term only if it is
 * a name a student could reasonably write for that diagnosis. Do not add loose
 * fragments such as "bleed", "mass", "rupture", or "obstruction" on their own,
 * because those words appear in several unrelated diagnoses and were the source
 * of the false positives in the first version.
 *
 * Clinical review status: DRAFT. Not yet signed off by the three reviewing
 * emergency physicians. See docs/answer-key-review.md.
 */
export const DIAGNOSES: DiagnosisEntry[] = [
  // Cardiovascular
  {
    id: 'acs',
    name: 'Acute coronary syndrome',
    category: 'Cardiovascular',
    terms: [
      'acute coronary syndrome',
      'acs',
      'myocardial infarction',
      'mi',
      'nstemi',
      'stemi',
      'heart attack',
      'unstable angina',
      'angina',
      'cardiac ischemia',
      'myocardial ischemia',
    ],
  },
  {
    id: 'aortic-dissection',
    name: 'Aortic dissection',
    category: 'Cardiovascular',
    terms: ['aortic dissection', 'dissecting aorta', 'thoracic dissection', 'type a dissection'],
  },
  {
    id: 'aaa-rupture',
    name: 'AAA rupture',
    category: 'Cardiovascular',
    terms: [
      'aaa',
      'abdominal aortic aneurysm',
      'ruptured aaa',
      'ruptured aortic aneurysm',
      'aortic aneurysm',
    ],
  },
  {
    id: 'pericarditis',
    name: 'Pericarditis',
    category: 'Cardiovascular',
    terms: ['pericarditis', 'pericardial effusion', 'tamponade', 'cardiac tamponade'],
  },
  {
    id: 'myocarditis',
    name: 'Myocarditis',
    category: 'Cardiovascular',
    terms: ['myocarditis'],
  },
  {
    id: 'heart-failure',
    name: 'Heart failure',
    category: 'Cardiovascular',
    terms: [
      'heart failure',
      'chf',
      'congestive heart failure',
      'pulmonary edema',
      'volume overload',
      'decompensated heart failure',
      'hfpef',
      'hfref',
    ],
  },
  {
    id: 'dysrhythmia',
    name: 'Dysrhythmia',
    category: 'Cardiovascular',
    terms: [
      'dysrhythmia',
      'arrhythmia',
      'atrial fibrillation',
      'afib',
      'a fib',
      'svt',
      'ventricular tachycardia',
      'vtach',
      'v tach',
      'heart block',
      'bradycardia',
      'tachyarrhythmia',
      'long qt',
      'torsades',
    ],
  },
  {
    id: 'aortic-stenosis',
    name: 'Aortic stenosis',
    category: 'Cardiovascular',
    terms: ['aortic stenosis', 'critical aortic stenosis', 'valvular obstruction', 'as'],
  },
  {
    id: 'hypertensive-emergency',
    name: 'Hypertensive emergency',
    category: 'Cardiovascular',
    terms: ['hypertensive emergency', 'hypertensive crisis', 'malignant hypertension', 'prees'],
  },
  {
    id: 'cervical-artery-dissection',
    name: 'Cervical artery dissection',
    category: 'Cardiovascular',
    terms: [
      'cervical artery dissection',
      'carotid dissection',
      'vertebral artery dissection',
      'vertebral dissection',
    ],
  },
  {
    id: 'temporal-arteritis',
    name: 'Temporal arteritis',
    category: 'Cardiovascular',
    terms: ['temporal arteritis', 'giant cell arteritis', 'gca'],
  },

  // Pulmonary
  {
    id: 'pulmonary-embolism',
    name: 'Pulmonary embolism',
    category: 'Pulmonary',
    terms: [
      'pulmonary embolism',
      'pulmonary embolus',
      'pulmonary emboli',
      'pe',
      'pulmonary embolic disease',
      'lung clot',
      'clot in the lung',
      'saddle embolus',
    ],
  },
  {
    id: 'pneumothorax',
    name: 'Pneumothorax',
    category: 'Pulmonary',
    terms: ['pneumothorax', 'ptx', 'tension pneumothorax', 'collapsed lung'],
  },
  {
    id: 'pneumonia',
    name: 'Pneumonia',
    category: 'Pulmonary',
    terms: ['pneumonia', 'cap', 'community acquired pneumonia', 'lung infection', 'pna'],
  },
  {
    id: 'asthma',
    name: 'Asthma',
    category: 'Pulmonary',
    terms: ['asthma', 'asthma exacerbation', 'bronchospasm', 'reactive airway'],
  },
  {
    id: 'copd',
    name: 'COPD exacerbation',
    category: 'Pulmonary',
    terms: ['copd', 'copd exacerbation', 'emphysema', 'chronic bronchitis'],
  },
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis',
    category: 'Pulmonary',
    terms: ['anaphylaxis', 'anaphylactic reaction', 'allergic reaction', 'angioedema'],
  },
  {
    id: 'pleural-effusion',
    name: 'Pleural effusion',
    category: 'Pulmonary',
    terms: ['pleural effusion', 'effusion', 'hemothorax'],
  },

  // GI and hepatobiliary
  {
    id: 'gerd',
    name: 'GERD',
    category: 'GI / hepatobiliary',
    terms: ['gerd', 'reflux', 'acid reflux', 'heartburn', 'esophagitis', 'dyspepsia'],
  },
  {
    id: 'esophageal-rupture',
    name: 'Esophageal rupture',
    category: 'GI / hepatobiliary',
    terms: ['esophageal rupture', 'boerhaave', 'esophageal perforation', 'ruptured esophagus'],
  },
  {
    id: 'pancreatitis',
    name: 'Pancreatitis',
    category: 'GI / hepatobiliary',
    terms: ['pancreatitis'],
  },
  {
    id: 'appendicitis',
    name: 'Appendicitis',
    category: 'GI / hepatobiliary',
    terms: ['appendicitis', 'appy', 'appendiceal rupture'],
  },
  {
    id: 'cholecystitis',
    name: 'Cholecystitis',
    category: 'GI / hepatobiliary',
    terms: ['cholecystitis', 'biliary colic', 'gallstones', 'cholelithiasis', 'cholangitis'],
  },
  {
    id: 'gastroenteritis',
    name: 'Gastroenteritis',
    category: 'GI / hepatobiliary',
    terms: ['gastroenteritis', 'stomach bug', 'viral gastroenteritis', 'food poisoning'],
  },
  {
    id: 'bowel-obstruction',
    name: 'Bowel obstruction',
    category: 'GI / hepatobiliary',
    terms: [
      'bowel obstruction',
      'small bowel obstruction',
      'large bowel obstruction',
      'sbo',
      'lbo',
      'obstructed bowel',
      'volvulus',
      'ileus',
    ],
  },
  {
    id: 'mesenteric-ischemia',
    name: 'Mesenteric ischemia',
    category: 'GI / hepatobiliary',
    terms: ['mesenteric ischemia', 'ischemic bowel', 'bowel ischemia', 'ischemic colitis'],
  },
  {
    id: 'peptic-ulcer',
    name: 'Peptic ulcer disease',
    category: 'GI / hepatobiliary',
    terms: ['peptic ulcer', 'pud', 'perforated ulcer', 'gastric ulcer', 'duodenal ulcer'],
  },
  {
    id: 'gi-bleed',
    name: 'GI bleed',
    category: 'GI / hepatobiliary',
    terms: [
      'gi bleed',
      'gib',
      'gastrointestinal bleed',
      'gastrointestinal hemorrhage',
      'upper gi bleed',
      'lower gi bleed',
      'variceal bleed',
      'melena',
      'hematemesis',
    ],
  },
  {
    id: 'diverticulitis',
    name: 'Diverticulitis',
    category: 'GI / hepatobiliary',
    terms: ['diverticulitis'],
  },

  // Neurologic
  {
    id: 'sah',
    name: 'Subarachnoid hemorrhage',
    category: 'Neurologic',
    terms: [
      'subarachnoid hemorrhage',
      'subarachnoid bleed',
      'sah',
      'ruptured aneurysm',
      'berry aneurysm',
      'aneurysmal bleed',
    ],
  },
  {
    id: 'ich',
    name: 'Intracranial hemorrhage',
    category: 'Neurologic',
    terms: [
      'intracranial hemorrhage',
      'intracranial bleed',
      'ich',
      'brain bleed',
      'intraparenchymal hemorrhage',
      'subdural hematoma',
      'subdural',
      'epidural hematoma',
    ],
  },
  {
    id: 'stroke',
    name: 'Stroke',
    category: 'Neurologic',
    terms: ['stroke', 'cva', 'cerebrovascular accident', 'tia', 'ischemic stroke', 'brain infarct'],
  },
  {
    id: 'seizure',
    name: 'Seizure',
    category: 'Neurologic',
    terms: ['seizure', 'epilepsy', 'postictal', 'post ictal', 'convulsion', 'status epilepticus'],
  },
  {
    id: 'migraine',
    name: 'Migraine',
    category: 'Neurologic',
    terms: ['migraine', 'migraine headache', 'migrainous'],
  },
  {
    id: 'tension-headache',
    name: 'Tension headache',
    category: 'Neurologic',
    terms: ['tension headache', 'tension type headache', 'muscle tension headache'],
  },
  {
    id: 'intracranial-mass',
    name: 'Intracranial mass',
    category: 'Neurologic',
    terms: [
      'intracranial mass',
      'brain tumor',
      'brain mass',
      'cns tumor',
      'space occupying lesion',
      'cerebral mass',
      'malignancy in the brain',
    ],
  },
  {
    id: 'cvst',
    name: 'Cerebral venous sinus thrombosis',
    category: 'Neurologic',
    terms: [
      'cerebral venous sinus thrombosis',
      'venous sinus thrombosis',
      'cvst',
      'cerebral vein thrombosis',
      'dural sinus thrombosis',
    ],
  },
  {
    id: 'idiopathic-intracranial-hypertension',
    name: 'Idiopathic intracranial hypertension',
    category: 'Neurologic',
    terms: ['idiopathic intracranial hypertension', 'iih', 'pseudotumor cerebri'],
  },

  // Infectious
  {
    id: 'sepsis',
    name: 'Sepsis',
    category: 'Infectious',
    terms: ['sepsis', 'septic', 'septic shock', 'severe infection', 'bacteremia'],
  },
  {
    id: 'meningitis',
    name: 'Meningitis',
    category: 'Infectious',
    terms: ['meningitis', 'meningoencephalitis', 'encephalitis', 'cns infection'],
  },
  {
    id: 'pid',
    name: 'Pelvic inflammatory disease',
    category: 'OB / GYN',
    terms: ['pelvic inflammatory disease', 'pid', 'tubo ovarian abscess', 'tuboovarian abscess'],
  },
  {
    id: 'sinusitis',
    name: 'Sinusitis',
    category: 'Infectious',
    terms: ['sinusitis', 'sinus infection', 'rhinosinusitis'],
  },

  // Metabolic and endocrine
  {
    id: 'dka',
    name: 'Diabetic ketoacidosis',
    category: 'Metabolic / endocrine',
    terms: ['dka', 'diabetic ketoacidosis', 'ketoacidosis', 'hhs', 'hyperosmolar'],
  },
  {
    id: 'hypoglycemia',
    name: 'Hypoglycemia',
    category: 'Metabolic / endocrine',
    terms: ['hypoglycemia', 'low blood sugar', 'low glucose'],
  },
  {
    id: 'anemia',
    name: 'Anemia',
    category: 'Metabolic / endocrine',
    terms: ['anemia', 'anaemia', 'blood loss anemia'],
  },
  {
    id: 'electrolyte',
    name: 'Electrolyte derangement',
    category: 'Metabolic / endocrine',
    terms: [
      'electrolyte abnormality',
      'electrolyte derangement',
      'hyperkalemia',
      'hypokalemia',
      'hyponatremia',
      'hypercalcemia',
    ],
  },
  {
    id: 'thyroid',
    name: 'Thyroid disease',
    category: 'Metabolic / endocrine',
    terms: ['thyroid storm', 'hyperthyroidism', 'hypothyroidism', 'myxedema', 'thyrotoxicosis'],
  },
  {
    id: 'adrenal-insufficiency',
    name: 'Adrenal insufficiency',
    category: 'Metabolic / endocrine',
    terms: ['adrenal insufficiency', 'addisonian crisis', 'adrenal crisis'],
  },

  // Renal and GU
  {
    id: 'nephrolithiasis',
    name: 'Nephrolithiasis',
    category: 'Renal / GU',
    terms: ['kidney stone', 'nephrolithiasis', 'renal colic', 'ureteral stone', 'urolithiasis'],
  },
  {
    id: 'pyelonephritis',
    name: 'Pyelonephritis',
    category: 'Renal / GU',
    terms: ['pyelonephritis', 'pyelo', 'kidney infection'],
  },
  {
    id: 'uti',
    name: 'Urinary tract infection',
    category: 'Renal / GU',
    terms: ['urinary tract infection', 'uti', 'cystitis', 'bladder infection'],
  },
  {
    id: 'testicular-torsion',
    name: 'Testicular torsion',
    category: 'Renal / GU',
    terms: ['testicular torsion', 'torsion of the testis'],
  },
  {
    id: 'urinary-retention',
    name: 'Urinary retention',
    category: 'Renal / GU',
    terms: ['urinary retention', 'obstructive uropathy', 'urinary obstruction'],
  },

  // Musculoskeletal
  {
    id: 'costochondritis',
    name: 'Costochondritis',
    category: 'Musculoskeletal',
    terms: ['costochondritis', 'chest wall pain', 'musculoskeletal chest pain', 'rib pain'],
  },
  {
    id: 'muscle-strain',
    name: 'Muscle strain',
    category: 'Musculoskeletal',
    terms: ['muscle strain', 'muscular strain', 'muscle spasm', 'myalgia'],
  },
  {
    id: 'rib-fracture',
    name: 'Rib fracture',
    category: 'Musculoskeletal',
    terms: ['rib fracture', 'fractured rib', 'broken rib'],
  },

  // Toxicologic
  {
    id: 'co-poisoning',
    name: 'Carbon monoxide poisoning',
    category: 'Toxicologic',
    terms: ['carbon monoxide poisoning', 'carbon monoxide', 'co poisoning', 'co toxicity'],
  },
  {
    id: 'sympathomimetic',
    name: 'Sympathomimetic toxicity',
    category: 'Toxicologic',
    terms: [
      'cocaine',
      'sympathomimetic',
      'stimulant use',
      'methamphetamine',
      'amphetamine',
      'cocaine use',
    ],
  },
  {
    id: 'intoxication',
    name: 'Intoxication or overdose',
    category: 'Toxicologic',
    terms: [
      'intoxication',
      'overdose',
      'alcohol intoxication',
      'opioid overdose',
      'poisoning',
      'toxic ingestion',
      'medication side effect',
      'polypharmacy',
    ],
  },
  {
    id: 'toxic-inhalation',
    name: 'Toxic inhalation',
    category: 'Toxicologic',
    terms: ['toxic inhalation', 'smoke inhalation', 'inhalational injury'],
  },

  // OB and GYN
  {
    id: 'ectopic-pregnancy',
    name: 'Ectopic pregnancy',
    category: 'OB / GYN',
    terms: [
      'ectopic pregnancy',
      'ectopic',
      'ruptured ectopic',
      'tubal pregnancy',
      'ruptured ectopic pregnancy',
    ],
  },
  {
    id: 'ovarian-torsion',
    name: 'Ovarian torsion',
    category: 'OB / GYN',
    terms: ['ovarian torsion', 'adnexal torsion', 'torsed ovary'],
  },
  {
    id: 'ovarian-cyst',
    name: 'Ovarian cyst',
    category: 'OB / GYN',
    terms: ['ovarian cyst', 'ruptured ovarian cyst', 'hemorrhagic cyst', 'mittelschmerz'],
  },
  {
    id: 'intrauterine-pregnancy',
    name: 'Intrauterine pregnancy',
    category: 'OB / GYN',
    terms: ['intrauterine pregnancy', 'normal pregnancy', 'pregnancy', 'miscarriage', 'threatened abortion'],
  },

  // Psych and behavioral
  {
    id: 'anxiety',
    name: 'Anxiety or panic',
    category: 'Psych / behavioral',
    terms: ['anxiety', 'panic attack', 'panic disorder', 'somatization', 'stress reaction'],
  },

  // Other
  {
    id: 'vasovagal',
    name: 'Vasovagal syncope',
    category: 'Other',
    terms: ['vasovagal', 'vasovagal syncope', 'neurocardiogenic syncope', 'reflex syncope'],
  },
  {
    id: 'orthostasis',
    name: 'Orthostasis',
    category: 'Other',
    terms: ['orthostasis', 'orthostatic hypotension', 'dehydration', 'hypovolemia', 'volume depletion'],
  },
]

export const DIAGNOSIS_BY_ID = new Map(DIAGNOSES.map((entry) => [entry.id, entry]))

export const diagnosisName = (id: string) => DIAGNOSIS_BY_ID.get(id)?.name ?? id
