import { teachingCases } from '../data/cases'
import type { LearnerLevel } from './types'

/**
 * A room is a persistent place a QR code points to.
 *
 * - "open" mode runs without an instructor. The room serves a case of the day at the room's level.
 *   Each learner sees the room's answers right after submitting.
 * - "led" mode is an instructor-run round. Answers stay hidden until the instructor reveals them.
 *   A led round that nobody closes falls back to open mode after LED_ROUND_TTL_MS.
 * - "lobby" mode holds the room before an instructor-run session. Learners who join see a waiting screen
 *   instead of the case of the day, so nobody starts early. It falls back to open mode the same way.
 */
export type RoomMode = 'open' | 'led' | 'lobby'

export type RoomRecord = {
  code: string
  label: string
  level: LearnerLevel
  mode: RoomMode
  caseId: string
  roundId: string
  roundStartedAt: string
  roundSeconds: number
  revealed: boolean
  updatedAt: string
}

export type RoomPatch = Partial<
  Pick<RoomRecord, 'label' | 'level' | 'mode' | 'caseId' | 'roundId' | 'roundStartedAt' | 'roundSeconds' | 'revealed'>
>

export type ActiveRound = {
  roundId: string
  caseId: string
  level: LearnerLevel
  mode: RoomMode
  /** Led rounds only. */
  endsAt: number | null
  revealed: boolean
}

export const ROUND_SECONDS = 4 * 60
export const LED_ROUND_TTL_MS = 90 * 60 * 1000
export const MAX_RESPONSE_LENGTH = 600

const pad = (value: number) => String(value).padStart(2, '0')

/** The learner's local calendar date. Everyone in one classroom shares a time zone. */
export const localDate = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

const hash = (value: string) => {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

export const caseOfTheDay = (roomCode: string, date: string) =>
  teachingCases[hash(`${roomCode}:${date}`) % teachingCases.length].id

export const isOpenRound = (roundId: string) => roundId.startsWith('open-')

const OPEN_ROUND_PATTERN = /^open-(\d{4})-(\d{2})-(\d{2})-(M[1-4])$/
/** A learner's calendar date can differ from the server's by a time zone, so allow a day and a half either way. */
const OPEN_ROUND_SKEW_MS = 36 * 60 * 60 * 1000

/**
 * Whether an open round id is one the room could be serving right now: today's date, at the room's level.
 * The Apps Script backend mirrors this rule; keep them in sync.
 */
export const openRoundValid = (roundId: string, level: LearnerLevel, now: Date) => {
  const match = OPEN_ROUND_PATTERN.exec(roundId)
  if (!match || match[4] !== level) return false
  const noon = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
  return Math.abs(now.getTime() - noon) <= OPEN_ROUND_SKEW_MS
}

export const ledRoundActive = (room: RoomRecord, now: Date) =>
  room.mode === 'led' &&
  Boolean(room.roundStartedAt) &&
  now.getTime() - Date.parse(room.roundStartedAt) < LED_ROUND_TTL_MS

export const lobbyActive = (room: RoomRecord, now: Date) =>
  room.mode === 'lobby' &&
  Boolean(room.roundStartedAt) &&
  now.getTime() - Date.parse(room.roundStartedAt) < LED_ROUND_TTL_MS

export const LOBBY_ROUND_ID = 'lobby'

export const resolveRound = (room: RoomRecord, now: Date = new Date()): ActiveRound => {
  if (lobbyActive(room, now)) {
    return { roundId: LOBBY_ROUND_ID, caseId: room.caseId, level: room.level, mode: 'lobby', endsAt: null, revealed: false }
  }
  if (ledRoundActive(room, now)) {
    return {
      roundId: room.roundId,
      caseId: room.caseId,
      level: room.level,
      mode: 'led',
      endsAt: Date.parse(room.roundStartedAt) + room.roundSeconds * 1000,
      revealed: room.revealed,
    }
  }
  const date = localDate(now)
  return {
    roundId: `open-${date}-${room.level}`,
    caseId: caseOfTheDay(room.code, date),
    level: room.level,
    mode: 'open',
    endsAt: null,
    revealed: false,
  }
}

export const startLedRound = (caseId: string, level: LearnerLevel, now: Date = new Date()): RoomPatch => ({
  mode: 'led',
  caseId,
  level,
  roundId: `led-${now.getTime().toString(36)}`,
  roundStartedAt: now.toISOString(),
  roundSeconds: ROUND_SECONDS,
  revealed: false,
})

/** Hold the room for a session. Nothing can be answered until the instructor starts a round. */
export const openLobby = (now: Date = new Date()): RoomPatch => ({
  mode: 'lobby',
  roundId: '',
  roundStartedAt: now.toISOString(),
  revealed: false,
})

/**
 * Who may read a round's answers. The Apps Script backend mirrors this rule; keep them in sync.
 * - The host always can.
 * - In an open round, a learner can once they have submitted.
 * - In a led round, everyone can once the instructor reveals.
 */
export const canSeeResponses = (input: {
  room: RoomRecord
  roundId: string
  isHost: boolean
  learnerSubmitted: boolean
}) =>
  input.isHost ||
  (isOpenRound(input.roundId) && input.learnerSubmitted) ||
  (input.room.mode === 'led' && input.room.revealed && input.room.roundId === input.roundId)
