import { describe, expect, it } from 'vitest'
import { scoreSubmission } from '../scoring/score'
import { toCsv } from './csv'

const cantMiss = ['acs', 'pulmonary-embolism']
const context = { sessionId: 'sess-1', arm: 'intervention', caseId: 'chest-pain', level: 'M1' }

const score = (id: string, text: string) =>
  scoreSubmission({ id, participantId: id, text, submittedAt: '2026-01-08T10:00:00.000Z' }, cantMiss)

describe('csv export', () => {
  it('writes a header and one row per submission', () => {
    const csv = toCsv([score('p1', 'ACS, PE'), score('p2', 'GERD')], context)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('participant_id')
    expect(lines[0]).toContain('individual_coverage_pct')
  })

  it('carries the raw text and the derived score on the same row', () => {
    const csv = toCsv([score('p1', 'ACS, PE, GERD')], context)
    expect(csv).toContain('ACS, PE, GERD'.replace('ACS, PE, GERD', '"ACS, PE, GERD"'))
    expect(csv).toContain('Acute coronary syndrome | Pulmonary embolism')
  })

  it('quotes cells that contain commas, quotes, or newlines', () => {
    const csv = toCsv([score('p1', 'ACS, "possible" PE\nalso GERD')], context)
    expect(csv).toContain('""possible""')
    const rows = csv.split('\n')
    expect(rows.length).toBeGreaterThan(2)
  })

  it('records misses so a null result can be checked against the raw answers', () => {
    const csv = toCsv([score('p1', 'GERD')], context)
    expect(csv).toContain('Acute coronary syndrome | Pulmonary embolism')
    expect(csv).toContain(',0,')
  })

  it('stamps the study arm on every row', () => {
    const csv = toCsv([score('p1', 'ACS')], context)
    expect(csv).toContain('sess-1,intervention,chest-pain,M1')
  })
})
