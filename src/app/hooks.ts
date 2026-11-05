import { useCallback, useEffect, useRef, useState } from 'react'

/** Re-renders every `intervalMs` with the current time. */
export const useNow = (intervalMs = 1000) => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}

/**
 * Calls `load` now and every `intervalMs` while the tab is visible. Restarts whenever `key` changes;
 * a null key pauses polling. Keeps the last good value on a failed poll so a flaky network does not blank the screen.
 */
export const usePolling = <T,>(key: string | null, load: () => Promise<T>, intervalMs: number) => {
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({
    key: null,
    data: null,
    error: null,
  })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (key === null) return undefined
    let cancelled = false
    const run = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const data = await loadRef.current()
        if (!cancelled) setState({ key, data, error: null })
      } catch (caught) {
        const error = caught instanceof Error ? caught.message : 'Connection problem'
        if (!cancelled) setState((current) => ({ key, data: current.key === key ? current.data : null, error }))
      }
    }
    void run()
    const timer = window.setInterval(run, intervalMs)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [key, intervalMs, tick])

  const refresh = useCallback(() => setTick((value) => value + 1), [])
  const current = state.key === key
  return { data: current ? state.data : null, error: current ? state.error : null, refresh }
}
