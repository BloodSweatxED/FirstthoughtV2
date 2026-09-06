import { describe, expect, it } from 'vitest'
import { parseResponse } from './match'

const ids = (text: string) => parseResponse(text).diagnosisIds
const names = (text: string) => parseResponse(text).mentions.map((mention) => mention.name)

describe('regressions from the substring matcher', () => {
  // Every case below scored a false positive in the first version, where terms
  // were checked with String.includes against the whole response.
  it('does not score migraine as an acute coronary syndrome', () => {
    expect(ids('migraine')).toEqual(['migraine'])
  })

  it('does not score appendicitis as a pulmonary embolism', () => {
    expect(ids('appendicitis')).toEqual(['appendicitis'])
  })

  it('does not score pericarditis as a pulmonary embolism', () => {
    expect(ids('pericarditis')).toEqual(['pericarditis'])
  })

  it('does not score a brain bleed as a GI bleed', () => {
    expect(ids('brain bleed')).toEqual(['ich'])
  })

  it('does not score spinal stenosis as aortic stenosis', () => {
    expect(ids('spinal stenosis')).toEqual([])
  })

  it('does not score airway obstruction as bowel obstruction', () => {
    expect(ids('airway obstruction')).toEqual([])
  })

  it('does not score a ruptured AAA as an esophageal rupture', () => {
    expect(ids('ruptured AAA')).toEqual(['aaa-rupture'])
  })

  it('does not score ordinary words as diagnoses', () => {
    expect(ids('mild chest pain that started this morning')).toEqual([])
    expect(ids('family history of early heart disease')).toEqual([])
    expect(ids('vomiting and diaphoresis')).toEqual([])
  })

  it('does not score a breast mass as an intracranial mass', () => {
    expect(ids('breast mass')).toEqual([])
  })
})

describe('abbreviations that are also English words', () => {
  it('ignores lower case "as"', () => {
    expect(ids('pain in the chest as described by the patient')).toEqual([])
  })

  it('accepts capitalised AS', () => {
    expect(ids('AS given the murmur')).toEqual(['aortic-stenosis'])
  })

  it('accepts the spelled out form regardless of case', () => {
    expect(ids('aortic stenosis')).toEqual(['aortic-stenosis'])
  })
})

describe('longest match wins', () => {
  it('scores an ectopic pregnancy once, not also as an intrauterine pregnancy', () => {
    expect(ids('ectopic pregnancy')).toEqual(['ectopic-pregnancy'])
    expect(ids('ruptured ectopic pregnancy')).toEqual(['ectopic-pregnancy'])
  })

  it('separates a pericardial effusion from a pleural effusion', () => {
    expect(ids('pericardial effusion')).toEqual(['pericarditis'])
    expect(ids('pleural effusion')).toEqual(['pleural-effusion'])
  })

  it('scores a tension pneumothorax once', () => {
    expect(ids('tension pneumothorax')).toEqual(['pneumothorax'])
  })
})

describe('real student answers', () => {
  it('reads a flat comma separated list', () => {
    expect(ids('ACS, PE, pneumonia, GERD, costochondritis')).toEqual([
      'acs',
      'pulmonary-embolism',
      'pneumonia',
      'gerd',
      'costochondritis',
    ])
  })

  it('reads a list organised by system', () => {
    const parsed = parseResponse(
      'Cardiac: ACS, myocarditis. Pulm: PE, pneumothorax. GI: GERD, pancreatitis',
    )
    expect(parsed.diagnosisIds).toContain('acs')
    expect(parsed.diagnosisIds).toContain('myocarditis')
    expect(parsed.diagnosisIds).toContain('pulmonary-embolism')
    expect(parsed.diagnosisIds).toContain('pneumothorax')
    expect(parsed.categories).toContain('Cardiovascular')
    expect(parsed.categories).toContain('Pulmonary')
    expect(parsed.categories).toContain('GI / hepatobiliary')
  })

  it('reads a numbered list with reasoning attached', () => {
    const parsed = parseResponse(
      '1. PE - recent immobility and pleuritic pain, cannot miss\n2. ACS - needs ECG and troponin\n3. COPD exacerbation',
    )
    expect(parsed.diagnosisIds).toEqual(['pulmonary-embolism', 'acs', 'copd'])
  })

  it('handles slashes and abbreviations', () => {
    expect(ids('r/o PE vs ACS vs aortic dissection')).toEqual([
      'pulmonary-embolism',
      'acs',
      'aortic-dissection',
    ])
  })

  it('is not case sensitive for ordinary terms', () => {
    expect(ids('Pulmonary Embolism')).toEqual(['pulmonary-embolism'])
    expect(ids('SUBARACHNOID HEMORRHAGE')).toEqual(['sah'])
  })
})

describe('negation', () => {
  it('flags a diagnosis the student ruled out in words', () => {
    const parsed = parseResponse('not pneumonia')
    expect(parsed.mentions[0].negated).toBe(true)
  })

  it('does not treat "rule out" as negation, because that is the target behaviour', () => {
    const parsed = parseResponse('rule out PE')
    expect(parsed.mentions[0].negated).toBe(false)
  })

  it('does not treat ranking language as negation', () => {
    const parsed = parseResponse('less likely pneumonia')
    expect(parsed.mentions[0].negated).toBe(false)
  })
})

describe('unmatched fragments', () => {
  it('reports answers the registry does not recognise', () => {
    const parsed = parseResponse('ACS, PE, Takotsubo cardiomyopathy')
    expect(parsed.unmatched.join(' ')).toContain('Takotsubo')
  })

  it('does not report fragments that already matched', () => {
    expect(parseResponse('ACS, PE').unmatched).toEqual([])
  })
})

describe('names are reported for audit', () => {
  it('returns readable names in order', () => {
    expect(names('SAH, meningitis')).toEqual(['Subarachnoid hemorrhage', 'Meningitis'])
  })
})
