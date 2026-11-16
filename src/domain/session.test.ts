import { describe, expect, it } from 'vitest'
import type { SessionResponse } from '../backend/types'
import { responsesOn, sessionCsv, sessionDates, summarizeSession } from './session'

const answer = (overrides: Partial<SessionResponse> & Pick<SessionResponse, 'text'>): SessionResponse => ({
  id: Math.random().toString(36).slice(2),
  learnerId: Math.random().toString(36).slice(2),
  createdAt: '2026-12-03T15:00:00',
  roundId: 'led-a',
  caseId: 'chest-pain',
  level: 'M1',
  ...overrides,
})

describe('session summary', () => {
  const session = [
    answer({ text: 'ACS, PE, dissection', createdAt: '2026-12-03T15:00:10' }),
    answer({ text: 'MI, GERD', createdAt: '2026-12-03T15:00:20' }),
    answer({ text: 'costochondritis, anxiety', createdAt: '2026-12-03T15:00:30' }),
    answer({ text: 'SAH, migraine', roundId: 'led-b', caseId: 'headache', level: 'M2', createdAt: '2026-12-03T15:10:00' }),
    answer({
      text: 'tension headache',
      roundId: 'led-b',
      caseId: 'headache',
      level: 'M2',
      createdAt: '2026-12-03T15:10:05',
      learnerId: 'sample-1',
    }),
  ]

  it('groups answers into rounds in the order they ran', () => {
    const summary = summarizeSession(session)
    expect(
      summary.rounds.map((round) => [round.teachingCase.id, round.level, round.mode, round.aggregate.responseCount]),
    ).toEqual([
      ['chest-pain', 'M1', 'led', 3],
      ['headache', 'M2', 'led', 2],
    ])
  })

  it('compares what the room caught with what the typical answer caught', () => {
    const summary = summarizeSession(session)
    // Chest pain M1 has 6 can't-miss; the room named ACS, PE, dissection. Headache M2 has 5; the room named SAH.
    expect(summary.cannotMissTotal).toBe(11)
    expect(summary.cannotMissNamed).toBe(4)
    // Per-answer coverage: 3/6, 1/6, 0, 1/5, 0. The median is 1/6.
    expect(summary.medianLearnerCoverage).toBeCloseTo(1 / 6)
    expect(summary.anyCannotMissShare).toBeCloseTo(3 / 5)
    expect(summary.responseCount).toBe(5)
    expect(summary.sampleCount).toBe(1)
    expect(summary.distinctDiagnoses).toBe(9)
  })

  it('skips rounds for cases this build does not know', () => {
    const summary = summarizeSession([...session, answer({ text: 'PE', roundId: 'led-c', caseId: 'retired-case' })])
    expect(summary.rounds).toHaveLength(2)
    expect(summary.responseCount).toBe(5)
  })

  it('lists the dates that have answers, newest first', () => {
    const older = answer({ text: 'PE', createdAt: '2026-11-19T15:00:00' })
    expect(sessionDates([older, ...session])).toEqual(['2026-12-03', '2026-11-19'])
    expect(responsesOn([older, ...session], '2026-11-19')).toEqual([older])
  })
})

describe('session export', () => {
  it('writes one row per answer with what the matcher read', () => {
    const csv = sessionCsv([answer({ text: 'ACS, "weird" thing', learnerId: 'abc' })])
    const [header, row] = csv.split('\r\n')
    expect(header).toContain('"cannot_miss_named"')
    expect(row).toContain(
      '"instructor-led","Chest pain","M1","abc","no","ACS, ""weird"" thing","Acute coronary syndrome","1","6","""weird"" thing"',
    )
  })

  it('defuses answers a spreadsheet would run as a formula', () => {
    const csv = sessionCsv([answer({ text: '=HYPERLINK("http://x")' })])
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`)
  })
})
