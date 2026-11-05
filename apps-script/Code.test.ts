import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

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

    const base = { action: 'submit', code, roundId: 'open-2026-12-01-M1', caseId: 'chest-pain', level: 'M1' }
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
    post({ action: 'updateRoom', code, hostKey, patch: { revealed: true } })
    expect(get({ action: 'getRoom', code }).room.revealed).toBe(true)
    expect(get({ action: 'getResponses', code, roundId: 'led-1' }).visible).toBe(true)
  })

  it('neutralizes formula-looking answers and rejects unknown actions', () => {
    const { get, post, rawAppends } = loadScript()
    const { room } = post({ action: 'createRoom', label: 'BAP', level: 'M1' })
    post({ action: 'submit', code: room.code, roundId: 'open-x', learnerId: 'a', caseId: 'x', level: 'M1', text: '=IMPORTXML("http://x")' })
    expect(rawAppends.at(-1)!.at(-1)).toBe(`'=IMPORTXML("http://x")`)
    expect(get({ action: 'dropTables' })).toMatchObject({ ok: false, error: 'Unknown action' })
  })
})
