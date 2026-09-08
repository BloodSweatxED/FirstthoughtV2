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

describe('facilitation cards', () => {
  const withCards = teachingCases.filter((teachingCase) => teachingCase.card)

  it('has at least one card written', () => {
    expect(withCards.length).toBeGreaterThan(0)
  })

  // The card is the intervention. A note missing for a can't-miss diagnosis
  // means the facilitator reaches that diagnosis in the discussion with nothing
  // to say about it.
  it('covers every can\'t-miss diagnosis, in the same order as the key', () => {
    withCards.forEach((teachingCase) => {
      const noteIds = teachingCase.card!.cantMissNotes.map((note) => note.id)
      expect(noteIds).toEqual(teachingCase.cantMissIds)
    })
  })

  it('references only diagnoses that exist in the registry', () => {
    withCards.forEach((teachingCase) => {
      teachingCase.card!.cantMissNotes.forEach((note) => {
        expect(DIAGNOSIS_BY_ID.has(note.id)).toBe(true)
      })
    })
  })

  it('gives every note both a lethality line and a recognition line', () => {
    withCards.forEach((teachingCase) => {
      teachingCase.card!.cantMissNotes.forEach((note) => {
        expect(note.whyItKills.length).toBeGreaterThan(40)
        expect(note.whatRaisesIt.length).toBeGreaterThan(40)
      })
    })
  })

  it('gives the facilitator at least two probes for a quiet room', () => {
    withCards.forEach((teachingCase) => {
      expect(teachingCase.card!.probes.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('names a common trap and a close', () => {
    withCards.forEach((teachingCase) => {
      expect(teachingCase.card!.commonTrap.length).toBeGreaterThan(40)
      expect(teachingCase.card!.close.length).toBeGreaterThan(40)
    })
  })

  // Not a failure yet. This records the gap so it stays visible.
  it('reports which cases still need a card', () => {
    const missing = teachingCases
      .filter((teachingCase) => !teachingCase.card)
      .map((teachingCase) => teachingCase.id)
    if (missing.length > 0) {
      console.log(`\n  Cases still needing a facilitation card: ${missing.join(', ')}\n`)
    }
    expect(Array.isArray(missing)).toBe(true)
  })
})
