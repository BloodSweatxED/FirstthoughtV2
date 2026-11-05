import * as core from './core'
import type { Backend } from './types'

/**
 * Browser-only backend. Works across tabs on one device, which is enough to rehearse.
 * It is also the fallback if the Sheets URL is not configured.
 */
const STORAGE_KEY = 'first-thought-local-db-v1'
export const DEMO_ROOM = { code: 'DEMO', hostKey: 'demo' }

const load = (): core.Db => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as core.Db
  } catch {
    // Fall through to a fresh database.
  }
  return { rooms: [], responses: [] }
}

const save = (db: core.Db) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Storage full or blocked. The session continues in memory for this tab.
  }
}

const withDb = async <T>(run: (db: core.Db) => T, write = false): Promise<T> => {
  const db = load()
  if (!db.rooms.some((room) => room.code === DEMO_ROOM.code)) {
    core.createRoom(db, { label: 'Demo room', level: 'M1', ...DEMO_ROOM })
    write = true
  }
  const result = run(db)
  if (write) save(db)
  return result
}

export const localBackend: Backend = {
  kind: 'local',
  createRoom: (input) => withDb((db) => core.createRoom(db, input), true),
  getRoom: (code) => withDb((db) => core.getRoom(db, code)),
  verifyHost: (code, hostKey) => withDb((db) => core.verifyHost(db, code, hostKey)),
  getResponses: (input) => withDb((db) => core.getResponses(db, input)),
  submit: (input) => withDb((db) => core.submit(db, input), true),
  updateRoom: (input) => withDb((db) => core.updateRoom(db, input), true),
}
