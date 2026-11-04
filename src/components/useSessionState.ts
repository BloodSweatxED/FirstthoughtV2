import { useEffect, useState } from 'react'
import { teachingCases } from '../data/cases'
import type { LearnerLevel, ResponseEntry } from '../domain/types'

const STORAGE_KEY = 'first-thought-ddx-session-v3'
export const SESSION_LENGTH_SECONDS = 4 * 60

type StoredSession = {
  level: LearnerLevel
  caseId: string
  responses: ResponseEntry[]
  secondsRemaining: number
}

const readStored = (): StoredSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

const createLearnerId = (index: number) => `Learner ${String(1000 + index * 37 + 14).slice(-4)}`

/** Browser-only session state. Week 2 replaces the responses source with the shared backend. */
export const useSessionState = () => {
  const [stored] = useState(readStored)
  const [level, setLevelState] = useState<LearnerLevel>(stored?.level ?? 'M1')
  const [caseId, setCaseIdState] = useState(stored?.caseId ?? teachingCases[0].id)
  const [responses, setResponses] = useState<ResponseEntry[]>(stored?.responses ?? [])
  const [secondsRemaining, setSecondsRemaining] = useState(stored?.secondsRemaining ?? SESSION_LENGTH_SECONDS)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ level, caseId, responses, secondsRemaining }))
    } catch {
      // Storage can be unavailable (private mode). The session still works in memory.
    }
  }, [caseId, level, responses, secondsRemaining])

  useEffect(() => {
    if (!timerRunning) return undefined
    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          setTimerRunning(false)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [timerRunning])

  const resetRound = () => {
    setResponses([])
    setSecondsRemaining(SESSION_LENGTH_SECONDS)
    setTimerRunning(false)
  }

  return {
    level,
    caseId,
    responses,
    secondsRemaining,
    timerRunning,
    /** A new level changes what learners see and the answer key, so it starts a fresh round. */
    setLevel: (next: LearnerLevel) => {
      setLevelState(next)
      resetRound()
    },
    setCaseId: (next: string) => {
      setCaseIdState(next)
      resetRound()
    },
    addResponse: (text: string) => {
      const clean = text.trim()
      if (!clean) return
      setResponses((current) => [
        ...current,
        { id: crypto.randomUUID(), learnerId: createLearnerId(current.length + 1), text: clean, createdAt: new Date().toISOString() },
      ])
    },
    toggleTimer: () => setTimerRunning((current) => (secondsRemaining > 0 ? !current : false)),
    resetTimer: () => {
      setSecondsRemaining(SESSION_LENGTH_SECONDS)
      setTimerRunning(false)
    },
    resetRound,
  }
}
