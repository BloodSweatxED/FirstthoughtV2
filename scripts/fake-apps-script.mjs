// Runs apps-script/Code.gs on a local HTTP server with an in-memory fake of Google Sheets.
// For rehearsing with several devices on one network without a Google account.
// Usage: node scripts/fake-apps-script.mjs [port]
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const port = Number(process.argv[2] ?? 8787)
const sheets = new Map()
const unquote = (cell) => (typeof cell === 'string' && cell.startsWith("'") ? cell.slice(1) : cell)
const makeSheet = (name) => ({
  getDataRange: () => ({ getValues: () => sheets.get(name).map((row) => [...row]) }),
  getRange: (row, col) => ({
    setValues: (values) =>
      values.forEach((value, i) => {
        const data = sheets.get(name)
        data[row - 1 + i] = data[row - 1 + i] ?? []
        value.forEach((cell, j) => (data[row - 1 + i][col - 1 + j] = unquote(cell)))
      }),
    setNumberFormat: () => undefined,
  }),
  getMaxRows: () => 1000,
  setFrozenRows: () => undefined,
  appendRow: (row) => sheets.get(name).push(row.map(unquote)),
})
const globals = {
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ({
      getSheetByName: (name) => (sheets.has(name) ? makeSheet(name) : null),
      insertSheet: (name) => (sheets.set(name, []), makeSheet(name)),
    }),
  },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (text) => ({ text, setMimeType() { return this } }) },
  Utilities: { getUuid: () => randomUUID() },
}
const source = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8')
const { doGet, doPost } = new Function(...Object.keys(globals), `${source}; return { doGet, doPost };`)(...Object.values(globals))

createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const url = new URL(req.url, 'http://x')
  if (req.method === 'GET') {
    res.end(doGet({ parameter: Object.fromEntries(url.searchParams) }).text)
    return
  }
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => res.end(doPost({ postData: { contents: body } }).text))
}).listen(port, () => console.log(`Fake Apps Script on http://localhost:${port}/exec`))
