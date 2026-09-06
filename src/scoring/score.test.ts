import { describe, expect, it } from 'vitest'
import { scoreSubmission, summarizeRoom, type Submission } from './score'

const cantMiss = ['acs', 'pulmonary-embolism', 'aortic-dissection', 'pneumothorax', 'esophageal-rupture']

const make = (id: string, text: string): Submission => ({
  id,
  participantId: id,
  text,
  submittedAt: '2026-01-08T10:00:00.000Z',
})

const score = (id: string, text: string) => scoreSubmission(make(id, text), cantMiss)

describe('individual scoring', () => {
  it('scores one student against the case key', () => {
    const result = score('s1', 'ACS, PE, GERD')
    expect(result.breadth).toBe(3)
    expect(result.cantMissNamed).toEqual(['acs', 'pulmonary-embolism'])
    expect(result.individualCoveragePct).toBe(40)
  })

  it('gives no credit for a blank answer', () => {
    const result = score('s2', '')
    expect(result.breadth).toBe(0)
    expect(result.individualCoveragePct).toBe(0)
  })
})

describe('room summary denominators', () => {
  // This is the flaw that made the first version unusable for comparing two
  // groups: the only coverage number reported was the union across everyone, so
  // it rose automatically with attendance.
  it('separates room level union from the mean individual score', () => {
    const scores = [
      score('s1', 'ACS'),
      score('s2', 'PE'),
      score('s3', 'aortic dissection'),
      score('s4', 'pneumothorax'),
      score('s5', 'esophageal rupture'),
    ]
    const summary = summarizeRoom(scores, cantMiss)

    // Everyone named exactly one of five, so each individual scored 20 percent.
    expect(summary.meanIndividualCoveragePct).toBe(20)
    // The union across all five looks like perfect coverage. It is not.
    expect(summary.roomCoveragePct).toBe(100)
  })

  it('does not inflate the mean when more students are added', () => {
    const small = summarizeRoom([score('a', 'ACS, PE')], cantMiss)
    const large = summarizeRoom(
      Array.from({ length: 30 }, (_, index) => score(`s${index}`, 'ACS, PE')),
      cantMiss,
    )
    expect(large.meanIndividualCoveragePct).toBe(small.meanIndividualCoveragePct)
    expect(large.roomCoveragePct).toBe(small.roomCoveragePct)
  })

  it('reports how many students named each can\'t-miss diagnosis', () => {
    const scores = [score('s1', 'ACS, PE'), score('s2', 'ACS'), score('s3', 'GERD')]
    const summary = summarizeRoom(scores, cantMiss)

    const acs = summary.cantMissTally.find((entry) => entry.id === 'acs')!
    expect(acs.namedByCount).toBe(2)
    expect(acs.namedByPct).toBe(67)

    const dissection = summary.cantMissTally.find((entry) => entry.id === 'aortic-dissection')!
    expect(dissection.namedByCount).toBe(0)
    expect(summary.roomMissed).toContain('Aortic dissection')
  })

  it('reports breadth as mean and median', () => {
    const summary = summarizeRoom(
      [score('s1', 'ACS'), score('s2', 'ACS, PE'), score('s3', 'ACS, PE, GERD')],
      cantMiss,
    )
    expect(summary.meanBreadth).toBe(2)
    expect(summary.medianBreadth).toBe(2)
  })

  it('handles an empty room without dividing by zero', () => {
    const summary = summarizeRoom([], cantMiss)
    expect(summary.n).toBe(0)
    expect(summary.meanIndividualCoveragePct).toBe(0)
    expect(summary.roomCoveragePct).toBe(0)
  })

  it('collects unrecognised answers for the term table review', () => {
    const summary = summarizeRoom([score('s1', 'ACS, Takotsubo')], cantMiss)
    expect(summary.unmatched.join(' ')).toContain('Takotsubo')
  })
})
