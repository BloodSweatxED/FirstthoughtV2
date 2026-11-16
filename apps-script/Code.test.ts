import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { localDate } from '../src/domain/rounds'

// Code.gs reads the real clock, so open rounds in these tests use today's date.
const OPEN_M1 = `open-${localDate(new Date())}-M1`

/** Runs the real Code.gs against an in-memory fake of the Sheets APIs it uses. */
const loadScript = () => {
  const sheets = new Map<string, unknown[][]>()
  const rawAppends: unknown[][] = []
  const makeSheet = (name: string) => ({
    getDataRange: () => ({ getValues: () => sheets.get(name)!.map((row) => [...row]) }),
    getRange: (row: number, col: number, rows: number, cols: number) => ({
      setValues: (values: unknown[][]) => {
        const data = sheets.get(name)!
        values.forEach((value, i) => {
          data[row - 1 + i] = data[row - 1 + i] ?? []
          value.forEach((cell, j) => {
            // Sheets drops a leading apostrophe that forces text.
            data[row - 1 + i][col - 1 + j] = typeof cell === 'string' && cell.startsWith("'") ? cell.slice(1) : cell
          })
        })
        void rows
        void cols
      },
      setNumberFormat: () => undefined,
    }),
    getMaxRows: () => 1000,
    setFrozenRows: () => undefined,
    appendRow: (row: unknown[]) =>
      rawAppends.push(row) &&
      sheets.get(name)!.push(row.map((cell) => (typeof cell === 'string' && cell.startsWith("'") ? cell.slice(1) : cell))),
  })
  const globals = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (name: string) => (sheets.has(name) ? makeSheet(name) : null),
        insertSheet: (name: string) => {
          sheets.set(name, [])
          return makeSheet(name)
        },
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock: () => undefined, releaseLock: () => undefined }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text: string) => ({ text, setMimeType() { return this } }),
    },
    Utilities: { getUuid: () => crypto.randomUUID() },
  }
  const source = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8')
  const factory = new Function(...Object.keys(globals), `${source}; return { doGet, doPost };`)
  const api = factory(...Object.values(globals)) as {
    doGet: (e: unknown) => { text: string }
    doPost: (e: unknown) => { text: string }
  }
  const get = (params: Record<string, unknown>) => JSON.parse(api.doGet({ parameter: params }).text)
  const post = (body: Record<string, unknown>) => JSON.parse(api.doPost({ postData: { contents: JSON.stringify(body) } }).text)
  return { get, post, sheets, rawAppends }
}

describe('Apps Script backend', () => {
  it('runs a full open-mode round', () => {
    const { get, post } = loadScript()
    const created = post({ action: 'createRoom', label: 'BAP', level: 'M1' })
    expect(created.ok).toBe(true)
    const { code } = created.room
    expect(get({ action: 'getRoom', code }).room).not.toHaveProperty('hostKey')

    const base = { action: 'submit', code, roundId: OPEN_M1, caseId: 'chest-pain', level: 'M1' }
    expect(post({ ...base, learnerId: 'a', text: 'PE, MI' }).ok).toBe(true)
    expect(get({ action: 'getResponses', code, roundId: base.roundId, learnerId: 'b' })).toMatchObject({ visible: false, count: 1 })
    expect(post({ ...base, learnerId: 'a', text: 'again' })).toMatchObject({ ok: false, error: /Already/ })
    post({ ...base, learnerId: 'b', text: 'dissection' })
    const seen = get({ action: 'getResponses', code, roundId: base.roundId, learnerId: 'b' })
    expect(seen.visible).toBe(true)
    expect(seen.responses.map((item: { text: string }) => item.text)).toEqual(['PE, MI', 'dissection'])
  })

  it('enforces the host key and the led-mode reveal', () => {
    const { get, post } = loadScript()
    const { room, hostKey } = post({ action: 'createRoom', label: 'BAP', level: 'M1' })
    const code = room.code
    expect(post({ action: 'verifyHost', code, hostKey }).valid).toBe(true)
    expect(post({ action: 'verifyHost', code, hostKey: 'nope' }).valid).toBe(false)
    expect(post({ action: 'updateRoom', code, hostKey: 'nope', patch: { revealed: true } })).toMatchObject({ ok: false })

    const patch = { mode: 'led', caseId: 'syncope', level: 'M4', roundId: 'led-1', roundStartedAt: new Date().toISOString(), revealed: false }
    expect(post({ action: 'updateRoom', code, hostKey, patch }).room).toMatchObject({ mode: 'led', revealed: false, level: 'M4' })
    post({ action: 'submit', code, roundId: 'led-1', learnerId: 'a', caseId: 'syncope', level: 'M4', text: 'arrhythmia' })
    expect(get({ action: 'getResponses', code, roundId: 'led-1', learnerId: 'a' }).visible).toBe(false)
    expect(post({ action: 'submit', code, roundId: 'led-other', learnerId: 'b', caseId: 'syncope', level: 'M4', text: 'PE' })).toMatchObject({ ok: false, error: /no longer open/ })
    post({ action: 'updateRoom', code, hostKey, patch: { revealed: true } })
    expect(get({ action: 'getRoom', code }).room.revealed).toBe(true)
    expect(get({ action: 'getResponses', code, roundId: 'led-1' }).visible).toBe(true)
    expect(post({ action: 'submit', code, roundId: 'led-1', learnerId: 'c', caseId: 'syncope', level: 'M4', text: 'PE' })).toMatchObject({ ok: false, error: /already revealed/ })
  })

  it('rejects rounds the room is not serving and records the room’s own case and level', () => {
    const { post, sheets } = loadScript()
    const { room, hostKey } = post({ action: 'createRoom', label: 'BAP', level: 'M1' })
    const code = room.code
    const base = { action: 'submit', code, caseId: 'chest-pain', level: 'M1', text: 'PE' }
    expect(post({ ...base, roundId: 'open-x', learnerId: 'a' })).toMatchObject({ ok: false, error: /no longer open/ })
    expect(post({ ...base, roundId: 'open-2020-01-01-M1', learnerId: 'a' })).toMatchObject({ ok: false, error: /no longer open/ })
    expect(post({ ...base, roundId: OPEN_M1.replace(/M1$/, 'M3'), learnerId: 'a' })).toMatchObject({ ok: false, error: /no longer open/ })
    expect(post({ ...base, roundId: 'led-1', learnerId: 'a' })).toMatchObject({ ok: false, error: /no longer open/ })

    const patch = { mode: 'led', caseId: 'syncope', level: 'M4', roundId: 'led-1', roundStartedAt: new Date().toISOString(), revealed: false }
    post({ action: 'updateRoom', code, hostKey, patch })
    expect(post({ ...base, roundId: 'led-1', learnerId: 'a' }).ok).toBe(true)
    const stored = sheets.get('responses')!.at(-1)!
    expect(stored.slice(5, 7)).toEqual(['syncope', 'M4'])
  })

  it('passes the lobby through and takes no answers while the room is held', () => {
    const { get, post } = loadScript()
    const { room, hostKey } = post({ action: 'createRoom', label: 'BAP', level: 'M1' })
    const code = room.code
    post({ action: 'updateRoom', code, hostKey, patch: { mode: 'lobby', roundId: '', roundStartedAt: new Date().toISOString(), revealed: false } })
    expect(get({ action: 'getRoom', code }).room.mode).toBe('lobby')
    expect(post({ action: 'submit', code, roundId: 'lobby', learnerId: 'a', caseId: 'chest-pain', level: 'M1', text: 'PE' })).toMatchObject({ ok: false, error: /no longer open/ })
    post({ action: 'updateRoom', code, hostKey, patch: { mode: 'something-else' } })
    expect(get({ action: 'getRoom', code }).room.mode).toBe('open')
  })

  it('returns the room history to the host only', () => {
    const { post } = loadScript()
    const { room, hostKey } = post({ action: 'createRoom', label: 'BAP', level: 'M1' })
    const code = room.code
    post({ action: 'submit', code, roundId: OPEN_M1, learnerId: 'a', caseId: 'chest-pain', level: 'M1', text: 'PE, MI' })
    expect(post({ action: 'getHistory', code, hostKey: 'nope' })).toMatchObject({ ok: false, error: /authorized/ })
    const history = post({ action: 'getHistory', code, hostKey })
    expect(history.responses).toHaveLength(1)
    expect(history.responses[0]).toMatchObject({ roundId: OPEN_M1, caseId: 'chest-pain', level: 'M1', text: 'PE, MI' })
    expect(post({ action: 'getHistory', code, hostKey, since: '2999-01-01T00:00:00.000Z' }).responses).toEqual([])
  })

  it('neutralizes formula-looking answers and rejects unknown actions', () => {
    const { get, post, rawAppends } = loadScript()
    const { room } = post({ action: 'createRoom', label: 'BAP', level: 'M1' })
    post({ action: 'submit', code: room.code, roundId: OPEN_M1, learnerId: 'a', caseId: 'x', level: 'M1', text: '=IMPORTXML("http://x")' })
    expect(rawAppends.at(-1)!.at(-1)).toBe(`'=IMPORTXML("http://x")`)
    expect(get({ action: 'dropTables' })).toMatchObject({ ok: false, error: 'Unknown action' })
  })
})
