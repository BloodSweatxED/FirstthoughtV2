import { useCallback } from 'react'
import { backend } from '../backend'
import { teachingCases } from '../data/cases'
import { resolveRound } from '../domain/rounds'
import { useNow, usePolling } from './hooks'

/** Polls the room and works out which round is live right now. */
export const useRoom = (code: string, intervalMs: number) => {
  const load = useCallback(() => backend.getRoom(code), [code])
  const { data: room, error, refresh } = usePolling(`room:${code}`, load, intervalMs)
  // Re-evaluate every few seconds so an abandoned led round falls back to open mode on its own.
  const now = useNow(5000)
  const round = room ? resolveRound(room, now) : null
  const teachingCase = round ? (teachingCases.find((item) => item.id === round.caseId) ?? teachingCases[0]) : null
  return { room, round, teachingCase, error, loading: room === null && !error, refresh }
}
