/** Per-device memory. Every access is guarded; private browsing can block storage. */
const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore. The page still works for this visit.
  }
}

const randomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
    : Math.random().toString(36).slice(2, 12)

/** A fresh anonymous id for every round, so answers cannot be linked across rounds. */
export const learnerIdFor = (code: string, roundId: string) => {
  const key = `ft-learner:${code}:${roundId}`
  const existing = read(key)
  if (existing) return existing
  const created = randomId()
  write(key, created)
  return created
}

export const savedAnswer = (code: string, roundId: string) => read(`ft-answer:${code}:${roundId}`)
export const saveAnswer = (code: string, roundId: string, text: string) => write(`ft-answer:${code}:${roundId}`, text)

const HOST_KEYS = 'ft-host-keys'
const hostKeys = (): Record<string, string> => {
  try {
    return JSON.parse(read(HOST_KEYS) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}
export const hostKeyFor = (code: string) => hostKeys()[code] ?? null
export const saveHostKey = (code: string, key: string) => write(HOST_KEYS, JSON.stringify({ ...hostKeys(), [code]: key }))
export const knownHostRooms = () => Object.keys(hostKeys())
