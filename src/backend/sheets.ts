import type { Backend } from './types'

/**
 * Google Sheets backend via an Apps Script web app (see apps-script/Code.gs and docs/sheets-setup.md).
 * Reads use GET. Writes use POST with a text/plain body, which avoids a CORS preflight that Apps Script cannot answer.
 */
type Envelope<T> = ({ ok: true } & T) | { ok: false; error: string }

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const createSheetsBackend = (url: string): Backend => {
  const call = async <T>(payload: Record<string, unknown>, method: 'GET' | 'POST'): Promise<T> => {
    let lastError: unknown
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response =
          method === 'GET'
            ? await fetch(`${url}?${new URLSearchParams(payload as Record<string, string>)}`)
            : await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload),
              })
        const body = (await response.json()) as Envelope<T>
        if (!body.ok) throw Object.assign(new Error(body.error), { fromServer: true })
        return body
      } catch (error) {
        // Server-side refusals (bad key, duplicate answer) will not succeed on retry.
        if ((error as { fromServer?: boolean }).fromServer) throw error
        lastError = error
        await sleep(400 * 2 ** attempt)
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Could not reach the room server')
  }

  return {
    kind: 'sheets',
    createRoom: (input) => call({ action: 'createRoom', ...input }, 'POST'),
    getRoom: async (code) => (await call<{ room: Awaited<ReturnType<Backend['getRoom']>> }>({ action: 'getRoom', code }, 'GET')).room,
    verifyHost: async (code, hostKey) =>
      (await call<{ valid: boolean }>({ action: 'verifyHost', code, hostKey }, 'POST')).valid,
    getResponses: (input) =>
      call(
        Object.fromEntries(Object.entries({ action: 'getResponses', ...input }).filter(([, value]) => value !== undefined)),
        input.hostKey ? 'POST' : 'GET',
      ),
    submit: async (input) => {
      await call({ action: 'submit', ...input }, 'POST')
    },
    updateRoom: async (input) =>
      (await call<{ room: Awaited<ReturnType<Backend['updateRoom']>> }>({ action: 'updateRoom', ...input }, 'POST')).room,
  }
}
