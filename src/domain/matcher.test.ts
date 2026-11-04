import { describe, expect, it } from 'vitest'
import { diagnoses } from '../data/diagnoses'
import { matchDiagnoses, normalize, splitItems } from './matcher'

const ids = (text: string) => matchDiagnoses(text).matched

describe('roast regressions: substrings must not count as diagnoses', () => {
  it.each([
    ['migraine with vomiting', 'acs'],
    ['mild symptoms, dismissed', 'acs'],
    ['perforated ulcer', 'pe'],
    ['pericarditis', 'pe'],
    ['rapid afib', 'pid'],
    ['describe the pain', 'chest-wall'],
    ['AAA rupture', 'esophageal-rupture'],
    ['brain bleed', 'gi-bleed'],
    ['cervical artery dissection', 'aortic-dissection'],
    ['massive PE', 'intracranial-mass'],
    ['adnexal mass', 'intracranial-mass'],
    ['outflow obstruction', 'bowel-obstruction'],
    ['testicular torsion', 'ovarian-torsion'],
    ['hemorrhagic stroke', 'stroke'],
  ])('"%s" does not match %s', (text, wrong) => {
    expect(ids(text)).not.toContain(wrong)
  })

  it.each([
    ['AAA rupture', 'aaa'],
    ['brain bleed', 'ich'],
    ['cervical artery dissection', 'cervical-artery-dissection'],
    ['massive PE', 'pe'],
    ['hemorrhagic stroke', 'ich'],
    ['rapid afib', 'dysrhythmia'],
  ])('"%s" still matches the right diagnosis (%s)', (text, right) => {
    expect(ids(text)).toContain(right)
  })
})

describe('real learner shorthand', () => {
  it.each([
    ['MI', 'acs'],
    ['NSTEMI', 'acs'],
    ['heart attack', 'acs'],
    ['PE', 'pe'],
    ['PE’s', 'pe'],
    ['tension PTX', 'pneumothorax'],
    ['Boerhaave’s', 'esophageal-rupture'],
    ['SBO', 'bowel-obstruction'],
    ['appy', 'appendicitis'],
    ['tubo-ovarian abscess', 'pid'],
    ['UGIB', 'gi-bleed'],
    ['seizures', 'seizure'],
    ['migraines', 'migraine'],
    ['kidney stones', 'kidney-stone'],
    ['CO poisoning', 'co-poisoning'],
    ['subdural', 'ich'],
    ['dissection', 'aortic-dissection'],
    ['A-fib with RVR', 'dysrhythmia'],
  ])('"%s" matches %s', (text, dx) => {
    expect(ids(text)).toContain(dx)
  })

  it('handles numbered lists, slashes, "vs", and r/o', () => {
    expect(ids('1. PE 2. MI 3. GERD')).toEqual(['pe', 'acs', 'gerd'])
    expect(ids('r/o ectopic; appy vs ruptured cyst; PID')).toEqual(['ectopic', 'appendicitis', 'ovarian-cyst', 'pid'])
    expect(ids('Most dangerous: STEMI, tension PTX. Most likely: MSK, reflux')).toEqual([
      'acs',
      'pneumothorax',
      'chest-wall',
      'gerd',
    ])
  })

  it('counts a diagnosis once even when repeated', () => {
    expect(ids('PE, pulmonary embolism, saddle PE')).toEqual(['pe'])
  })
})

describe('unrecognized text', () => {
  it('reports items with no known diagnosis, ignoring list labels', () => {
    const result = matchDiagnoses('Cardiac: ACS. Most likely:, need ECG, flurbleitis')
    expect(result.matched).toEqual(['acs'])
    expect(result.unrecognized).toEqual(['need ECG', 'flurbleitis'])
  })

  it('returns nothing for empty input', () => {
    expect(matchDiagnoses('   ')).toEqual({ matched: [], unrecognized: [] })
  })
})

describe('dictionary integrity', () => {
  it('has unique ids', () => {
    const seen = new Set<string>()
    for (const diagnosis of diagnoses) {
      expect(seen.has(diagnosis.id), diagnosis.id).toBe(false)
      seen.add(diagnosis.id)
    }
  })

  it('never assigns one synonym to two diagnoses', () => {
    const owner = new Map<string, string>()
    for (const diagnosis of diagnoses) {
      for (const synonym of diagnosis.synonyms) {
        const key = normalize(synonym)
        const existing = owner.get(key)
        expect(existing === undefined || existing === diagnosis.id, `"${synonym}" in ${existing} and ${diagnosis.id}`).toBe(true)
        owner.set(key, diagnosis.id)
      }
    }
  })

  it('every synonym matches its own diagnosis', () => {
    for (const diagnosis of diagnoses) {
      for (const synonym of diagnosis.synonyms) {
        expect(ids(synonym), `"${synonym}"`).toContain(diagnosis.id)
      }
    }
  })
})

describe('splitItems', () => {
  it('splits on common list separators', () => {
    expect(splitItems('PE, MI; GERD\nanxiety / panic')).toEqual(['PE', 'MI', 'GERD', 'anxiety', 'panic'])
  })
})
