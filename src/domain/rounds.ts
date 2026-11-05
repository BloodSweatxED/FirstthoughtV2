import { teachingCases } from '../data/cases'
import type { LearnerLevel } from './types'

/**
 * A room is a persistent place a QR code points to.
 *
 * - "open" mode runs without an instructor. The room serves a case of the day at the room's level.
 *   Each learner sees the room's answers right after submitting.
 * - "led" mode is an instructor-run round. Answers stay hidden until the instructor reveals them.
 *   A led round that nobody closes falls back to open mode after LED_ROUND_TTL_MS.
 */
export type RoomMode = 'open' | 'led'

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

export const ledRoundActive = (room: RoomRecord, now: Date) =>
  room.mode === 'led' &&
  Boolean(room.roundStartedAt) &&
  now.getTime() - Date.parse(room.roundStartedAt) < LED_ROUND_TTL_MS

export const resolveRound = (room: RoomRecord, now: Date = new Date()): ActiveRound => {
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
