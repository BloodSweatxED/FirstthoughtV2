import { describe, expect, it } from 'vitest'
import { LED_ROUND_TTL_MS, resolveRound, startLedRound } from '../domain/rounds'
import * as core from './core'

const fresh = (): core.Db => ({ rooms: [], responses: [] })
const NOW = new Date('2026-12-01T10:00:00')

const setup = () => {
  const db = fresh()
  const { room, hostKey } = core.createRoom(db, { label: 'BAP Thursday', level: 'M2' }, NOW)
  return { db, room, hostKey }
}

describe('rooms', () => {
  it('creates a 4-letter room in open mode and never leaks the host key', () => {
    const { db, room, hostKey } = setup()
    expect(room.code).toMatch(/^[A-Z]{4}$/)
    expect(room.mode).toBe('open')
    expect(JSON.stringify(core.getRoom(db, room.code))).not.toContain(hostKey)
    expect(core.getRoom(db, room.code.toLowerCase())?.code).toBe(room.code)
  })

  it('rejects room changes without the host key', () => {
    const { db, room } = setup()
    expect(() => core.updateRoom(db, { code: room.code, hostKey: 'wrong', patch: { revealed: true } })).toThrow(/authorized/)
  })
})

describe('open mode (no instructor)', () => {
  it('serves the same case of the day to everyone in the room', () => {
    const { room } = setup()
    const a = resolveRound(room, NOW)
    const b = resolveRound(room, new Date('2026-12-01T15:30:00'))
    expect(a.mode).toBe('open')
    expect(a.roundId).toBe(b.roundId)
    expect(a.caseId).toBe(b.caseId)
    expect(resolveRound(room, new Date('2026-12-02T10:00:00')).roundId).not.toBe(a.roundId)
  })

  it('hides answers until the learner submits, then shows the room', () => {
    const { db, room } = setup()
    const round = resolveRound(room, NOW)
    const base = { code: room.code, roundId: round.roundId, caseId: round.caseId, level: round.level }
    core.submit(db, { ...base, learnerId: 'a', text: 'PE, MI' }, NOW, '1')

    const before = core.getResponses(db, { code: room.code, roundId: round.roundId, learnerId: 'b' })
    expect(before).toEqual({ visible: false, count: 1, responses: [] })

    core.submit(db, { ...base, learnerId: 'b', text: 'dissection' }, NOW, '2')
    const after = core.getResponses(db, { code: room.code, roundId: round.roundId, learnerId: 'b' })
    expect(after.visible).toBe(true)
    expect(after.responses.map((item) => item.text)).toEqual(['PE, MI', 'dissection'])
  })

  it('allows one answer per learner per round and validates input', () => {
    const { db, room } = setup()
    const input = { code: room.code, roundId: 'open-x', learnerId: 'a', caseId: 'chest-pain', level: 'M1' as const, text: 'PE' }
    core.submit(db, input)
    expect(() => core.submit(db, input)).toThrow(/Already submitted/)
    expect(() => core.submit(db, { ...input, learnerId: 'b', text: '   ' })).toThrow(/Empty/)
    expect(() => core.submit(db, { ...input, learnerId: 'c', text: 'x'.repeat(601) })).toThrow(/limited/)
    expect(() => core.submit(db, { ...input, code: 'ZZZZ' })).toThrow(/not found/)
  })
})

describe('led mode (instructor present)', () => {
  it('keeps answers hidden from learners until the instructor reveals, even after they submit', () => {
    const { db, room, hostKey } = setup()
    core.updateRoom(db, { code: room.code, hostKey, patch: startLedRound('headache', 'M3', NOW) }, NOW)
    const round = resolveRound(core.getRoom(db, room.code)!, NOW)
    expect(round).toMatchObject({ mode: 'led', caseId: 'headache', level: 'M3' })

    core.submit(db, { code: room.code, roundId: round.roundId, learnerId: 'a', caseId: 'headache', level: 'M3', text: 'SAH' })
    expect(core.getResponses(db, { code: room.code, roundId: round.roundId, learnerId: 'a' }).visible).toBe(false)
    expect(core.getResponses(db, { code: room.code, roundId: round.roundId, hostKey }).visible).toBe(true)

    core.updateRoom(db, { code: room.code, hostKey, patch: { revealed: true } })
    expect(core.getResponses(db, { code: room.code, roundId: round.roundId, learnerId: 'zzz' }).visible).toBe(true)
  })

  it('falls back to open mode if the instructor never closes the round', () => {
    const { db, room, hostKey } = setup()
    core.updateRoom(db, { code: room.code, hostKey, patch: startLedRound('headache', 'M3', NOW) })
    const later = new Date(NOW.getTime() + LED_ROUND_TTL_MS + 1000)
    expect(resolveRound(core.getRoom(db, room.code)!, later).mode).toBe('open')
  })
})
