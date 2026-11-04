import type { Diagnosis } from '../domain/types'

/**
 * The diagnosis dictionary. Every answer key and every match resolves to an id here.
 *
 * Rules for synonyms:
 * - Matching is whole-word after lowercasing and stripping punctuation, so "mi" never matches "migraine".
 * - Longer phrases win. "cervical artery dissection" is claimed before bare "dissection" can be.
 * - A synonym may belong to only one diagnosis. A test enforces this.
 * - Leave out phrases that are genuinely ambiguous (for example "ruptured aneurysm").
 */
export const diagnoses: Diagnosis[] = [
  // Cardiovascular
  {
    id: 'acs',
    name: 'Acute coronary syndrome',
    categories: ['Cardiovascular'],
    synonyms: [
      'acute coronary syndrome',
      'acs',
      'mi',
      'ami',
      'stemi',
      'nstemi',
      'myocardial infarction',
      'heart attack',
      'unstable angina',
      'cardiac ischemia',
      'myocardial ischemia',
      'coronary ischemia',
    ],
  },
  {
    id: 'aortic-dissection',
    name: 'Aortic dissection',
    categories: ['Cardiovascular'],
    synonyms: ['aortic dissection', 'dissection', 'thoracic dissection', 'dissecting aorta', 'type a dissection', 'type b dissection'],
  },
  {
    id: 'tamponade',
    name: 'Cardiac tamponade',
    categories: ['Cardiovascular'],
    synonyms: ['tamponade', 'cardiac tamponade', 'pericardial tamponade', 'pericardial effusion'],
  },
  {
    id: 'pericarditis',
    name: 'Pericarditis',
    categories: ['Cardiovascular'],
    synonyms: ['pericarditis'],
  },
  {
    id: 'myocarditis',
    name: 'Myocarditis',
    categories: ['Cardiovascular'],
    synonyms: ['myocarditis'],
  },
  {
    id: 'heart-failure',
    name: 'Heart failure',
    categories: ['Cardiovascular'],
    synonyms: [
      'heart failure',
      'chf',
      'hf',
      'hfref',
      'hfpef',
      'adhf',
      'chf exacerbation',
      'pulmonary edema',
      'flash pulmonary edema',
      'fluid overload',
      'volume overload',
      'cardiogenic shock',
    ],
  },
  {
    id: 'dysrhythmia',
    name: 'Dysrhythmia',
    categories: ['Cardiovascular'],
    synonyms: [
      'dysrhythmia',
      'arrhythmia',
      'afib',
      'a fib',
      'atrial fibrillation',
      'rvr',
      'svt',
      'vtach',
      'v tach',
      'vt',
      'ventricular tachycardia',
      'heart block',
      'complete heart block',
      'av block',
      'bradycardia',
      'bradyarrhythmia',
      'tachyarrhythmia',
      'sick sinus',
      'sick sinus syndrome',
      'long qt',
      'brugada',
      'wpw',
    ],
  },
  {
    id: 'aortic-stenosis',
    name: 'Aortic stenosis',
    categories: ['Cardiovascular'],
    synonyms: ['aortic stenosis', 'aortic valve stenosis', 'critical aortic stenosis', 'valvular disease', 'outflow obstruction', 'hocm', 'hypertrophic cardiomyopathy'],
  },
  {
    id: 'aaa',
    name: 'Ruptured abdominal aortic aneurysm',
    categories: ['Cardiovascular'],
    synonyms: ['aaa', 'aaa rupture', 'ruptured aaa', 'abdominal aortic aneurysm', 'ruptured abdominal aortic aneurysm', 'aortic aneurysm'],
  },
  {
    id: 'mesenteric-ischemia',
    name: 'Mesenteric ischemia',
    categories: ['Cardiovascular', 'GI / hepatobiliary'],
    synonyms: ['mesenteric ischemia', 'ischemic bowel', 'bowel ischemia', 'mesenteric infarction', 'mesenteric thrombosis', 'ischemic colitis'],
  },
  {
    id: 'hypertensive-emergency',
    name: 'Hypertensive emergency',
    categories: ['Cardiovascular'],
    synonyms: ['hypertensive emergency', 'hypertensive crisis', 'hypertensive urgency', 'malignant hypertension', 'hypertensive encephalopathy', 'pres'],
  },
  {
    id: 'vasovagal',
    name: 'Vasovagal (reflex) syncope',
    categories: ['Cardiovascular'],
    synonyms: ['vasovagal', 'vasovagal syncope', 'neurocardiogenic', 'neurocardiogenic syncope', 'reflex syncope', 'situational syncope'],
  },
  {
    id: 'orthostasis',
    name: 'Orthostatic hypotension',
    categories: ['Cardiovascular'],
    synonyms: ['orthostasis', 'orthostatic', 'orthostatic hypotension', 'orthostatic syncope'],
  },

  // Pulmonary / airway
  {
    id: 'pe',
    name: 'Pulmonary embolism',
    categories: ['Pulmonary / airway', 'Cardiovascular'],
    synonyms: ['pulmonary embolism', 'pulmonary embolus', 'pulmonary emboli', 'pe', 'saddle pe', 'massive pe', 'vte'],
  },
  {
    id: 'pneumothorax',
    name: 'Pneumothorax (incl. tension)',
    categories: ['Pulmonary / airway'],
    synonyms: ['pneumothorax', 'ptx', 'tension pneumothorax', 'tension ptx', 'collapsed lung'],
  },
  {
    id: 'pneumonia',
    name: 'Pneumonia',
    categories: ['Pulmonary / airway', 'Infectious'],
    synonyms: ['pneumonia', 'pna', 'cap', 'hcap', 'lung infection', 'aspiration pneumonia', 'lobar pneumonia', 'bronchitis'],
  },
  {
    id: 'asthma',
    name: 'Asthma exacerbation',
    categories: ['Pulmonary / airway'],
    synonyms: ['asthma', 'asthma exacerbation', 'status asthmaticus', 'reactive airway', 'reactive airway disease', 'bronchospasm'],
  },
  {
    id: 'copd',
    name: 'COPD exacerbation',
    categories: ['Pulmonary / airway'],
    synonyms: ['copd', 'copd exacerbation', 'aecopd', 'emphysema', 'chronic bronchitis'],
  },
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis',
    categories: ['Pulmonary / airway'],
    synonyms: ['anaphylaxis', 'anaphylactic', 'anaphylactic shock', 'allergic reaction', 'angioedema'],
  },

  // GI / hepatobiliary
  {
    id: 'gerd',
    name: 'GERD / esophagitis',
    categories: ['GI / hepatobiliary'],
    synonyms: ['gerd', 'reflux', 'acid reflux', 'gastroesophageal reflux', 'esophagitis', 'heartburn', 'dyspepsia', 'esophageal spasm', 'gastritis'],
  },
  {
    id: 'esophageal-rupture',
    name: 'Esophageal rupture',
    categories: ['GI / hepatobiliary'],
    synonyms: ['esophageal rupture', 'boerhaave', 'boerhaave syndrome', 'esophageal perforation', 'perforated esophagus'],
  },
  {
    id: 'pancreatitis',
    name: 'Pancreatitis',
    categories: ['GI / hepatobiliary'],
    synonyms: ['pancreatitis'],
  },
  {
    id: 'appendicitis',
    name: 'Appendicitis',
    categories: ['GI / hepatobiliary'],
    synonyms: ['appendicitis', 'appy', 'ruptured appendix', 'perforated appendix'],
  },
  {
    id: 'biliary',
    name: 'Biliary disease (cholecystitis, cholangitis)',
    categories: ['GI / hepatobiliary'],
    synonyms: ['cholecystitis', 'cholangitis', 'biliary colic', 'gallstones', 'cholelithiasis', 'choledocholithiasis', 'gallbladder'],
  },
  {
    id: 'gastroenteritis',
    name: 'Gastroenteritis',
    categories: ['GI / hepatobiliary', 'Infectious'],
    synonyms: ['gastroenteritis', 'stomach flu', 'viral gastroenteritis', 'food poisoning', 'infectious diarrhea', 'colitis'],
  },
  {
    id: 'bowel-obstruction',
    name: 'Bowel obstruction',
    categories: ['GI / hepatobiliary'],
    synonyms: ['bowel obstruction', 'sbo', 'lbo', 'small bowel obstruction', 'large bowel obstruction', 'obstruction', 'volvulus', 'ileus', 'incarcerated hernia'],
  },
  {
    id: 'perforated-viscus',
    name: 'Perforated viscus / peptic ulcer',
    categories: ['GI / hepatobiliary'],
    synonyms: ['perforated viscus', 'perforated ulcer', 'perforation', 'perf', 'free air', 'peptic ulcer', 'peptic ulcer disease', 'pud', 'ulcer', 'hollow viscus perforation'],
  },
  {
    id: 'gi-bleed',
    name: 'GI bleed',
    categories: ['GI / hepatobiliary', 'Hematologic'],
    synonyms: [
      'gi bleed',
      'gib',
      'ugib',
      'lgib',
      'upper gi bleed',
      'lower gi bleed',
      'gi hemorrhage',
      'gastrointestinal bleed',
      'gastrointestinal hemorrhage',
      'gastrointestinal bleeding',
      'gi bleeding',
      'bleeding ulcer',
      'melena',
      'hematochezia',
      'hematemesis',
      'variceal bleed',
    ],
  },

  // Neurologic
  {
    id: 'sah',
    name: 'Subarachnoid hemorrhage',
    categories: ['Neurologic'],
    synonyms: ['subarachnoid hemorrhage', 'subarachnoid', 'sah', 'aneurysmal bleed', 'brain aneurysm', 'cerebral aneurysm', 'ruptured brain aneurysm', 'sentinel bleed'],
  },
  {
    id: 'ich',
    name: 'Intracranial hemorrhage',
    categories: ['Neurologic'],
    synonyms: [
      'intracranial hemorrhage',
      'intracranial bleed',
      'ich',
      'intracerebral hemorrhage',
      'brain bleed',
      'head bleed',
      'hemorrhagic stroke',
      'subdural',
      'subdural hematoma',
      'sdh',
      'epidural hematoma',
      'edh',
    ],
  },
  {
    id: 'stroke',
    name: 'Ischemic stroke / TIA',
    categories: ['Neurologic'],
    synonyms: ['stroke', 'ischemic stroke', 'cva', 'tia', 'transient ischemic attack', 'cerebrovascular accident', 'posterior circulation stroke', 'vertebrobasilar insufficiency'],
  },
  {
    id: 'seizure',
    name: 'Seizure',
    categories: ['Neurologic'],
    synonyms: ['seizure', 'sz', 'epilepsy', 'convulsion', 'status epilepticus', 'postictal'],
  },
  {
    id: 'migraine',
    name: 'Migraine',
    categories: ['Neurologic'],
    synonyms: ['migraine', 'migraine headache', 'migraine with aura'],
  },
  {
    id: 'tension-headache',
    name: 'Tension-type headache',
    categories: ['Neurologic'],
    synonyms: ['tension headache', 'tension type headache', 'tth'],
  },
  {
    id: 'cluster-headache',
    name: 'Cluster headache',
    categories: ['Neurologic'],
    synonyms: ['cluster headache', 'cluster'],
  },
  {
    id: 'intracranial-mass',
    name: 'Intracranial mass',
    categories: ['Neurologic'],
    synonyms: ['intracranial mass', 'brain tumor', 'brain mass', 'mass lesion', 'mass', 'tumor', 'brain metastasis', 'brain mets', 'space occupying lesion', 'glioma', 'neoplasm', 'brain abscess'],
  },
  {
    id: 'cvst',
    name: 'Cerebral venous sinus thrombosis',
    categories: ['Neurologic'],
    synonyms: ['cerebral venous sinus thrombosis', 'cvst', 'cvt', 'venous sinus thrombosis', 'sinus thrombosis', 'dural sinus thrombosis', 'cerebral venous thrombosis'],
  },
  {
    id: 'cervical-artery-dissection',
    name: 'Cervical artery dissection',
    categories: ['Neurologic'],
    synonyms: ['cervical artery dissection', 'carotid dissection', 'carotid artery dissection', 'vertebral dissection', 'vertebral artery dissection'],
  },
  {
    id: 'rcvs',
    name: 'Reversible cerebral vasoconstriction syndrome',
    categories: ['Neurologic'],
    synonyms: ['rcvs', 'reversible cerebral vasoconstriction', 'reversible cerebral vasoconstriction syndrome', 'call fleming'],
  },
  {
    id: 'iih',
    name: 'Idiopathic intracranial hypertension',
    categories: ['Neurologic'],
    synonyms: ['iih', 'idiopathic intracranial hypertension', 'pseudotumor', 'pseudotumor cerebri'],
  },

  // Infectious
  {
    id: 'sepsis',
    name: 'Sepsis',
    categories: ['Infectious'],
    synonyms: ['sepsis', 'septic', 'septic shock', 'bacteremia', 'urosepsis'],
  },
  {
    id: 'meningitis',
    name: 'Meningitis / encephalitis',
    categories: ['Infectious', 'Neurologic'],
    synonyms: ['meningitis', 'bacterial meningitis', 'viral meningitis', 'encephalitis', 'meningoencephalitis', 'cns infection'],
  },
  {
    id: 'sinusitis',
    name: 'Sinusitis',
    categories: ['Infectious'],
    synonyms: ['sinusitis', 'sinus infection'],
  },
  {
    id: 'uti',
    name: 'UTI / pyelonephritis',
    categories: ['Renal / GU', 'Infectious'],
    synonyms: ['uti', 'urinary tract infection', 'cystitis', 'pyelo', 'pyelonephritis', 'kidney infection'],
  },
  {
    id: 'pid',
    name: 'PID / tubo-ovarian abscess',
    categories: ['OB / GYN', 'Infectious'],
    synonyms: ['pid', 'pelvic inflammatory disease', 'toa', 'tubo ovarian abscess', 'tuboovarian abscess', 'salpingitis'],
  },

  // Metabolic / endocrine
  {
    id: 'dka',
    name: 'DKA / HHS',
    categories: ['Metabolic / endocrine'],
    synonyms: ['dka', 'diabetic ketoacidosis', 'hhs', 'hyperosmolar hyperglycemic state'],
  },
  {
    id: 'hypoglycemia',
    name: 'Hypoglycemia',
    categories: ['Metabolic / endocrine'],
    synonyms: ['hypoglycemia', 'hypoglycemic', 'low blood sugar', 'low sugar', 'low glucose'],
  },
  {
    id: 'thyroid',
    name: 'Thyroid disease',
    categories: ['Metabolic / endocrine'],
    synonyms: ['thyroid', 'thyroid storm', 'thyrotoxicosis', 'hyperthyroidism', 'hypothyroidism', 'myxedema'],
  },
  {
    id: 'electrolyte',
    name: 'Electrolyte abnormality',
    categories: ['Metabolic / endocrine'],
    synonyms: ['electrolyte abnormality', 'electrolytes', 'hyperkalemia', 'hypokalemia', 'hyponatremia', 'hypernatremia', 'hypocalcemia', 'hypercalcemia', 'hypomagnesemia'],
  },
  {
    id: 'hypovolemia',
    name: 'Hypovolemia / dehydration',
    categories: ['Metabolic / endocrine'],
    synonyms: ['hypovolemia', 'dehydration', 'volume depletion', 'hypovolemic', 'dehydrated'],
  },

  // Hematologic
  {
    id: 'anemia',
    name: 'Anemia',
    categories: ['Hematologic'],
    synonyms: ['anemia', 'anemic', 'symptomatic anemia', 'low hemoglobin'],
  },

  // Renal / GU
  {
    id: 'kidney-stone',
    name: 'Kidney stone',
    categories: ['Renal / GU'],
    synonyms: ['kidney stone', 'nephrolithiasis', 'urolithiasis', 'ureterolithiasis', 'renal colic', 'renal stone', 'stone'],
  },
  {
    id: 'testicular-torsion',
    name: 'Testicular torsion',
    categories: ['Renal / GU'],
    synonyms: ['testicular torsion'],
  },

  // OB / GYN
  {
    id: 'ectopic',
    name: 'Ectopic pregnancy',
    categories: ['OB / GYN'],
    synonyms: ['ectopic', 'ectopic pregnancy', 'ruptured ectopic', 'tubal pregnancy'],
  },
  {
    id: 'ovarian-torsion',
    name: 'Ovarian torsion',
    categories: ['OB / GYN'],
    synonyms: ['ovarian torsion', 'adnexal torsion', 'torsion'],
  },
  {
    id: 'ovarian-cyst',
    name: 'Ruptured ovarian cyst',
    categories: ['OB / GYN'],
    synonyms: ['ovarian cyst', 'ruptured ovarian cyst', 'ruptured cyst', 'hemorrhagic cyst', 'corpus luteum cyst'],
  },
  {
    id: 'pregnancy',
    name: 'Intrauterine pregnancy / miscarriage',
    categories: ['OB / GYN'],
    synonyms: ['pregnancy', 'pregnant', 'iup', 'miscarriage', 'spontaneous abortion', 'threatened abortion'],
  },
  {
    id: 'endometriosis',
    name: 'Endometriosis / dysmenorrhea',
    categories: ['OB / GYN'],
    synonyms: ['endometriosis', 'dysmenorrhea', 'mittelschmerz'],
  },

  // Bare "mass" and "tumor" resolve to intracranial mass, so other sites need their own longer phrases.
  {
    id: 'malignancy',
    name: 'Malignancy (non-CNS)',
    categories: ['Hematologic'],
    synonyms: ['malignancy', 'cancer', 'lung cancer', 'lung mass', 'abdominal mass', 'pelvic mass', 'adnexal mass', 'colon cancer', 'lymphoma', 'leukemia'],
  },

  // Musculoskeletal
  {
    id: 'chest-wall',
    name: 'Chest wall / musculoskeletal pain',
    categories: ['Musculoskeletal'],
    synonyms: ['costochondritis', 'chest wall pain', 'msk', 'musculoskeletal', 'musculoskeletal pain', 'muscle strain', 'strain', 'rib fracture', 'tietze'],
  },

  // Toxicologic
  {
    id: 'co-poisoning',
    name: 'Carbon monoxide poisoning',
    categories: ['Toxicologic'],
    synonyms: ['carbon monoxide', 'carbon monoxide poisoning', 'co poisoning', 'co toxicity', 'co exposure'],
  },
  {
    id: 'sympathomimetic',
    name: 'Sympathomimetic toxicity',
    categories: ['Toxicologic'],
    synonyms: ['cocaine', 'cocaine induced', 'sympathomimetic', 'stimulant', 'stimulants', 'meth', 'methamphetamine', 'amphetamine'],
  },
  {
    id: 'intoxication',
    name: 'Intoxication / overdose',
    categories: ['Toxicologic'],
    synonyms: ['intoxication', 'overdose', 'od', 'ingestion', 'toxic ingestion', 'drug use', 'substance use', 'alcohol', 'etoh', 'withdrawal', 'tox', 'toxidrome'],
  },
  {
    id: 'medication-effect',
    name: 'Medication effect',
    categories: ['Toxicologic'],
    synonyms: ['medication effect', 'medication side effect', 'side effect', 'drug induced', 'medication induced', 'polypharmacy', 'beta blocker', 'beta blocker toxicity', 'diuretic'],
  },
  {
    id: 'toxic-inhalation',
    name: 'Toxic inhalation',
    categories: ['Toxicologic', 'Pulmonary / airway'],
    synonyms: ['toxic inhalation', 'smoke inhalation', 'inhalation injury'],
  },

  // Psych / behavioral
  {
    id: 'anxiety',
    name: 'Anxiety / panic',
    categories: ['Psych / behavioral'],
    synonyms: ['anxiety', 'panic', 'panic attack', 'panic disorder', 'psychogenic', 'somatization', 'conversion'],
  },

  // Other
  {
    id: 'temporal-arteritis',
    name: 'Giant cell (temporal) arteritis',
    categories: ['Other'],
    synonyms: ['temporal arteritis', 'giant cell arteritis', 'gca'],
  },
  {
    id: 'zoster',
    name: 'Herpes zoster',
    categories: ['Infectious'],
    synonyms: ['zoster', 'shingles', 'herpes zoster'],
  },
]

export const diagnosisById: Record<string, Diagnosis> = Object.fromEntries(
  diagnoses.map((diagnosis) => [diagnosis.id, diagnosis]),
)
