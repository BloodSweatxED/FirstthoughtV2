import { describe, expect, it } from 'vitest'
import { DIAGNOSIS_BY_ID } from '../scoring/diagnoses'
import { parseResponse } from '../scoring/match'
import { teachingCases } from './cases'

describe('case answer keys', () => {
  // A typo in an answer key would make a can't-miss diagnosis impossible to
  // score, and every student would silently be marked as having missed it.
  it('references only diagnoses that exist in the registry', () => {
    const unknown: string[] = []
    teachingCases.forEach((teachingCase) => {
      ;[...teachingCase.cantMissIds, ...teachingCase.importantMissIds].forEach((id) => {
        if (!DIAGNOSIS_BY_ID.has(id)) {
          unknown.push(`${teachingCase.id}: ${id}`)
        }
      })
    })
    expect(unknown).toEqual([])
  })

  it('gives every case a can\'t-miss list', () => {
    teachingCases.forEach((teachingCase) => {
      expect(teachingCase.cantMissIds.length).toBeGreaterThan(0)
    })
  })

  it('does not list the same diagnosis as both can\'t-miss and important miss', () => {
    teachingCases.forEach((teachingCase) => {
      const overlap = teachingCase.cantMissIds.filter((id) =>
        teachingCase.importantMissIds.includes(id),
      )
      expect(overlap).toEqual([])
    })
  })

  it('uses unique case ids', () => {
    const ids = teachingCases.map((teachingCase) => teachingCase.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // The demo answers drive the "add sample" button in front of faculty. If the
  // matcher cannot read them, the app looks broken during the pitch.
  it('parses every sample response into at least one recognised diagnosis', () => {
    teachingCases.forEach((teachingCase) => {
      teachingCase.sampleResponses.forEach((sample) => {
        expect(parseResponse(sample).diagnosisIds.length).toBeGreaterThan(0)
      })
    })
  })

  it('scores each case as reachable: the samples together name most of the key', () => {
    teachingCases.forEach((teachingCase) => {
      const named = new Set(
        teachingCase.sampleResponses.flatMap((sample) => parseResponse(sample).diagnosisIds),
      )
      const hit = teachingCase.cantMissIds.filter((id) => named.has(id))
      expect(hit.length).toBeGreaterThan(0)
    })
  })
})
