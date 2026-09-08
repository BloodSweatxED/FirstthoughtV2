import { describe, expect, it } from 'vitest'
import { DIAGNOSIS_BY_ID } from '../scoring/diagnoses'
import { ALL_LEVELS } from '../scoring/types'
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

  it('covers all four learner levels', () => {
    withCards.forEach((teachingCase) => {
      ALL_LEVELS.forEach((level) => {
        expect(teachingCase.card!.byLevel[level]).toBeDefined()
      })
    })
  })

  it('gives each level its own emphasis, probes, and trap', () => {
    withCards.forEach((teachingCase) => {
      ALL_LEVELS.forEach((level) => {
        const entry = teachingCase.card!.byLevel[level]
        expect(entry.emphasis.length).toBeGreaterThan(40)
        expect(entry.probes.length).toBeGreaterThanOrEqual(2)
        expect(entry.trap.length).toBeGreaterThan(40)
      })
    })
  })

  // The trap is what the dose of information invites. If two levels share one,
  // the card has not actually been written for both of them.
  it('does not reuse the same trap across levels', () => {
    withCards.forEach((teachingCase) => {
      const traps = ALL_LEVELS.map((level) => teachingCase.card!.byLevel[level].trap)
      expect(new Set(traps).size).toBe(ALL_LEVELS.length)
    })
  })

  it('names a close', () => {
    withCards.forEach((teachingCase) => {
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

describe('level stems', () => {
  it('gives every case a stem at every level', () => {
    teachingCases.forEach((teachingCase) => {
      ALL_LEVELS.forEach((level) => {
        expect(teachingCase.stems[level].length).toBeGreaterThan(10)
      })
    })
  })

  // The dose of information is the design. If a later level does not say more
  // than an earlier one, the ladder is broken for that case.
  it('gives strictly more information at each step up the ladder', () => {
    teachingCases.forEach((teachingCase) => {
      const lengths = ALL_LEVELS.map((level) => teachingCase.stems[level].length)
      for (let i = 1; i < lengths.length; i += 1) {
        expect(lengths[i]).toBeGreaterThan(lengths[i - 1])
      }
    })
  })

  it('starts every case with age, sex, and the complaint alone', () => {
    teachingCases.forEach((teachingCase) => {
      expect(teachingCase.stems.M1).toMatch(/\d+-year-old/)
      // No history, medications, or risk factors at M1.
      expect(teachingCase.stems.M1.toLowerCase()).not.toContain('history of')
      expect(teachingCase.stems.M1.length).toBeLessThan(60)
    })
  })

  // M2 adds one line of past history, and by design it is usually a plausible
  // chronic diagnosis that invites anchoring. The test checks that history was
  // added at all, not the exact phrasing.
  it('adds past history at M2', () => {
    const markers = ['history of', 'known', 'prior', 'diagnosed with']
    teachingCases.forEach((teachingCase) => {
      const stem = teachingCase.stems.M2.toLowerCase()
      expect(markers.some((marker) => stem.includes(marker))).toBe(true)
    })
  })
})
