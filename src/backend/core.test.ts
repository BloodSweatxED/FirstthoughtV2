import { describe, expect, it } from 'vitest'
import { LED_ROUND_TTL_MS, openLobby, resolveRound, startLedRound } from '../domain/rounds'
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
    const input = { code: room.code, roundId: 'open-2026-12-01-M2', learnerId: 'a', caseId: 'chest-pain', level: 'M2' as const, text: 'PE' }
    core.submit(db, input, NOW)
    expect(() => core.submit(db, input, NOW)).toThrow(/Already submitted/)
    expect(() => core.submit(db, { ...input, learnerId: 'b', text: '   ' }, NOW)).toThrow(/Empty/)
    expect(() => core.submit(db, { ...input, learnerId: 'c', text: 'x'.repeat(601) }, NOW)).toThrow(/limited/)
    expect(() => core.submit(db, { ...input, code: 'ZZZZ' }, NOW)).toThrow(/not found/)
  })

  it('only accepts today’s round at the room’s level', () => {
    const { db, room } = setup()
    const input = { code: room.code, learnerId: 'a', caseId: 'chest-pain', level: 'M2' as const, text: 'PE' }
    expect(() => core.submit(db, { ...input, roundId: 'open-x' }, NOW)).toThrow(/no longer open/)
    expect(() => core.submit(db, { ...input, roundId: 'open-2026-11-20-M2' }, NOW)).toThrow(/no longer open/)
    expect(() => core.submit(db, { ...input, roundId: 'open-2026-12-01-M4' }, NOW)).toThrow(/no longer open/)
    // A learner one time zone over may still be on yesterday's or tomorrow's date.
    core.submit(db, { ...input, roundId: 'open-2026-12-02-M2' }, NOW)
    expect(db.responses).toHaveLength(1)
  })
})

describe('led mode (instructor present)', () => {
  it('keeps answers hidden from learners until the instructor reveals, even after they submit', () => {
    const { db, room, hostKey } = setup()
    core.updateRoom(db, { code: room.code, hostKey, patch: startLedRound('headache', 'M3', NOW) }, NOW)
    const round = resolveRound(core.getRoom(db, room.code)!, NOW)
    expect(round).toMatchObject({ mode: 'led', caseId: 'headache', level: 'M3' })

    core.submit(db, { code: room.code, roundId: round.roundId, learnerId: 'a', caseId: 'headache', level: 'M3', text: 'SAH' }, NOW)
    expect(core.getResponses(db, { code: room.code, roundId: round.roundId, learnerId: 'a' }).visible).toBe(false)
    expect(core.getResponses(db, { code: room.code, roundId: round.roundId, hostKey }).visible).toBe(true)

    core.updateRoom(db, { code: room.code, hostKey, patch: { revealed: true } })
    expect(core.getResponses(db, { code: room.code, roundId: round.roundId, learnerId: 'zzz' }).visible).toBe(true)
  })

  it('takes the case and level from the room, and closes the round at reveal', () => {
    const { db, room, hostKey } = setup()
    core.updateRoom(db, { code: room.code, hostKey, patch: startLedRound('headache', 'M3', NOW) }, NOW)
    const round = resolveRound(core.getRoom(db, room.code)!, NOW)
    const input = { code: room.code, roundId: round.roundId, caseId: 'chest-pain', level: 'M1' as const, text: 'SAH' }

    core.submit(db, { ...input, learnerId: 'a' }, NOW)
    expect(db.responses[0]).toMatchObject({ caseId: 'headache', level: 'M3' })
    expect(() => core.submit(db, { ...input, learnerId: 'b', roundId: 'led-made-up' }, NOW)).toThrow(/no longer open/)

    core.updateRoom(db, { code: room.code, hostKey, patch: { revealed: true } }, NOW)
    expect(() => core.submit(db, { ...input, learnerId: 'c' }, NOW)).toThrow(/already revealed/)

    core.updateRoom(db, { code: room.code, hostKey, patch: { mode: 'open' } }, NOW)
    expect(() => core.submit(db, { ...input, learnerId: 'd' }, NOW)).toThrow(/no longer open/)
  })

  it('falls back to open mode if the instructor never closes the round', () => {
    const { db, room, hostKey } = setup()
    core.updateRoom(db, { code: room.code, hostKey, patch: startLedRound('headache', 'M3', NOW) })
    const later = new Date(NOW.getTime() + LED_ROUND_TTL_MS + 1000)
    expect(resolveRound(core.getRoom(db, room.code)!, later).mode).toBe('open')
  })
})

describe('lobby (before a session starts)', () => {
  it('holds learners on a waiting screen, takes no answers, and gives way to a led round', () => {
    const { db, room, hostKey } = setup()
    core.updateRoom(db, { code: room.code, hostKey, patch: openLobby(NOW) }, NOW)
    const waiting = resolveRound(core.getRoom(db, room.code)!, NOW)
    expect(waiting).toMatchObject({ mode: 'lobby', endsAt: null, revealed: false })
    const input = { code: room.code, roundId: waiting.roundId, learnerId: 'a', caseId: 'chest-pain', level: 'M2' as const, text: 'PE' }
    expect(() => core.submit(db, input, NOW)).toThrow(/no longer open/)

    core.updateRoom(db, { code: room.code, hostKey, patch: startLedRound('syncope', 'M1', NOW) }, NOW)
    expect(resolveRound(core.getRoom(db, room.code)!, NOW)).toMatchObject({ mode: 'led', caseId: 'syncope' })
  })

  it('falls back to open mode if the session never starts', () => {
    const { db, room, hostKey } = setup()
    core.updateRoom(db, { code: room.code, hostKey, patch: openLobby(NOW) }, NOW)
    const later = new Date(NOW.getTime() + LED_ROUND_TTL_MS + 1000)
    expect(resolveRound(core.getRoom(db, room.code)!, later).mode).toBe('open')
  })
})

describe('session history', () => {
  it('gives the host every answer in the room with its round, and nobody else', () => {
    const { db, room, hostKey } = setup()
    const other = core.createRoom(db, { label: 'Other', level: 'M2' }, NOW)
    const base = { caseId: 'chest-pain', level: 'M2' as const, roundId: 'open-2026-12-01-M2' }
    core.submit(db, { ...base, code: room.code, learnerId: 'a', text: 'PE' }, NOW, '1')
    core.submit(db, { ...base, code: other.room.code, learnerId: 'b', text: 'MI' }, NOW, '2')
    core.submit(db, { ...base, code: room.code, learnerId: 'c', text: 'GERD' }, new Date('2026-12-01T11:00:00Z'), '3')

    expect(() => core.getHistory(db, { code: room.code, hostKey: 'wrong' })).toThrow(/authorized/)
    const all = core.getHistory(db, { code: room.code, hostKey })
    expect(all.map((item) => item.text)).toEqual(['PE', 'GERD'])
    expect(all[0]).toMatchObject({ roundId: base.roundId, caseId: 'chest-pain', level: 'M2' })
    expect(all[0]).not.toHaveProperty('code')
    expect(core.getHistory(db, { code: room.code, hostKey, since: '2026-12-01T10:30:00.000Z' }).map((item) => item.text)).toEqual(['GERD'])
  })
})
