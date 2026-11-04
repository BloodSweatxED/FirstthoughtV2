import { describe, expect, it } from 'vitest'
import { teachingCases } from '../data/cases'
import { diagnosisById } from '../data/diagnoses'
import { aggregateResponses } from './aggregate'
import { answerKeyFor } from './answerKey'
import { matchDiagnoses } from './matcher'
import { LEARNER_LEVELS, type ResponseEntry } from './types'

const caseById = (id: string) => teachingCases.find((item) => item.id === id)!

const responses = (...texts: string[]): ResponseEntry[] =>
  texts.map((text, index) => ({ id: String(index), learnerId: `L${index}`, text, createdAt: '' }))

describe('case data integrity', () => {
  it.each(teachingCases.map((item) => [item.id, item]))('%s references only known diagnoses', (_, teachingCase) => {
    for (const entry of [...teachingCase.cannotMiss, ...teachingCase.mostLikely, ...teachingCase.alsoConsider]) {
      expect(diagnosisById[entry.dx], entry.dx).toBeDefined()
    }
  })

  it.each(teachingCases.map((item) => [item.id, item]))('%s has a non-empty key at every level, no diagnosis in two lists', (_, teachingCase) => {
    for (const level of LEARNER_LEVELS) {
      const key = answerKeyFor(teachingCase, level)
      expect(key.cannotMiss.length, `${level} cannotMiss`).toBeGreaterThan(0)
      expect(key.mostLikely.length, `${level} mostLikely`).toBeGreaterThan(0)
      const all = [...key.cannotMiss, ...key.mostLikely, ...key.alsoConsider]
      // A diagnosis may be both most likely and can't-miss (ACS in chest pain). It may not also be "also consider".
      for (const dx of key.alsoConsider) {
        expect(key.cannotMiss.includes(dx) || key.mostLikely.includes(dx), `${level} ${dx}`).toBe(false)
      }
      expect(all.length).toBeGreaterThan(0)
    }
  })

  it.each(teachingCases.map((item) => [item.id, item]))('%s sample responses are fully recognized', (_, teachingCase) => {
    for (const sample of teachingCase.sampleResponses) {
      expect(matchDiagnoses(sample).unrecognized, sample).toEqual([])
    }
  })
})

describe('level-aware answer keys', () => {
  it('drops AAA once learners know the patient is a 27-year-old woman', () => {
    const abdominal = caseById('abdominal-pain')
    expect(answerKeyFor(abdominal, 'M1').cannotMiss).toContain('aaa')
    expect(answerKeyFor(abdominal, 'M2').cannotMiss).not.toContain('aaa')
    expect(answerKeyFor(abdominal, 'M4').cannotMiss).toContain('ectopic')
  })

  it('moves aortic stenosis from can’t-miss to most likely once it appears in the history', () => {
    const syncope = caseById('syncope')
    expect(answerKeyFor(syncope, 'M2').cannotMiss).toContain('aortic-stenosis')
    expect(answerKeyFor(syncope, 'M3').cannotMiss).not.toContain('aortic-stenosis')
    expect(answerKeyFor(syncope, 'M3').mostLikely).toContain('aortic-stenosis')
  })

  it('treats ectopic as a can’t-miss for an unknown patient, not for a 72-year-old man', () => {
    const syncope = caseById('syncope')
    expect(answerKeyFor(syncope, 'M1').cannotMiss).toContain('ectopic')
    expect(answerKeyFor(syncope, 'M2').cannotMiss).not.toContain('ectopic')
  })
})

describe('room aggregate', () => {
  const key = answerKeyFor(caseById('chest-pain'), 'M1')

  it('no longer credits ACS for "migraine"', () => {
    const result = aggregateResponses(responses('migraine, vomiting'), key)
    expect(result.cannotMiss.find((item) => item.dx === 'acs')?.count).toBe(0)
    expect(result.roomCoverage).toBe(0)
  })

  it('counts how many learners named each can’t-miss and reports median learner coverage', () => {
    const result = aggregateResponses(
      responses('ACS, PE, dissection', 'MI, GERD', 'costochondritis, anxiety'),
      key,
    )
    expect(result.cannotMiss.find((item) => item.dx === 'acs')?.count).toBe(2)
    expect(result.cannotMiss.find((item) => item.dx === 'pe')?.count).toBe(1)
    expect(result.roomCoverage).toBeCloseTo(3 / 6)
    expect(result.medianLearnerCoverage).toBeCloseTo(1 / 6)
  })

  it('separates off-key diagnoses and unrecognized text', () => {
    const result = aggregateResponses(responses('ACS, kidney stone, glorbitis'), key)
    expect(result.offKey.map((item) => item.dx)).toEqual(['kidney-stone'])
    expect(result.unrecognized).toEqual(['glorbitis'])
  })
})
