import { teachingCases } from '../data/cases'
import {
  canSeeResponses,
  isOpenRound,
  ledRoundActive,
  MAX_RESPONSE_LENGTH,
  openRoundValid,
  ROUND_SECONDS,
  type RoomPatch,
  type RoomRecord,
} from '../domain/rounds'
import type { LearnerLevel } from '../domain/types'
import type { RoundResponses, SessionResponse, SubmitInput } from './types'

/**
 * Storage-agnostic room logic over a plain object.
 * The local backend runs this directly. apps-script/Code.gs is a line-for-line port; keep them in sync.
 */
export type StoredRoom = RoomRecord & { hostKey: string; createdAt: string }
export type StoredResponse = SessionResponse & { code: string }
export type Db = { rooms: StoredRoom[]; responses: StoredResponse[] }

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ'
const LEVELS: LearnerLevel[] = ['M1', 'M2', 'M3', 'M4']

const randomCode = (random: () => number) =>
  Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]).join('')

const randomKey = (random: () => number) =>
  Array.from({ length: 16 }, () => Math.floor(random() * 36).toString(36)).join('')

export const publicRoom = (room: StoredRoom): RoomRecord => ({
  code: room.code,
  label: room.label,
  level: room.level,
  mode: room.mode,
  caseId: room.caseId,
  roundId: room.roundId,
  roundStartedAt: room.roundStartedAt,
  roundSeconds: room.roundSeconds,
  revealed: room.revealed,
  updatedAt: room.updatedAt,
})

const findRoom = (db: Db, code: string) => db.rooms.find((room) => room.code === code.toUpperCase())

const requireRoom = (db: Db, code: string) => {
  const room = findRoom(db, code)
  if (!room) throw new Error('Room not found')
  return room
}

export const createRoom = (
  db: Db,
  input: { label: string; level: LearnerLevel; code?: string; hostKey?: string },
  now: Date = new Date(),
  random: () => number = Math.random,
) => {
  if (!LEVELS.includes(input.level)) throw new Error('Unknown level')
  let code = input.code?.toUpperCase() ?? randomCode(random)
  while (!input.code && findRoom(db, code)) code = randomCode(random)
  if (findRoom(db, code)) throw new Error('Room code already exists')

  const room: StoredRoom = {
    code,
    label: input.label.trim().slice(0, 80) || 'First Thought room',
    level: input.level,
    mode: 'open',
    caseId: teachingCases[0].id,
    roundId: '',
    roundStartedAt: '',
    roundSeconds: ROUND_SECONDS,
    revealed: false,
    updatedAt: now.toISOString(),
    createdAt: now.toISOString(),
    hostKey: input.hostKey ?? randomKey(random),
  }
  db.rooms.push(room)
  return { room: publicRoom(room), hostKey: room.hostKey }
}

export const getRoom = (db: Db, code: string) => {
  const room = findRoom(db, code)
  return room ? publicRoom(room) : null
}

export const verifyHost = (db: Db, code: string, hostKey: string) => findRoom(db, code)?.hostKey === hostKey

export const getResponses = (
  db: Db,
  input: { code: string; roundId: string; learnerId?: string; hostKey?: string },
): RoundResponses => {
  const room = requireRoom(db, input.code)
  const inRound = db.responses.filter((item) => item.code === room.code && item.roundId === input.roundId)
  const visible = canSeeResponses({
    room: publicRoom(room),
    roundId: input.roundId,
    isHost: Boolean(input.hostKey) && input.hostKey === room.hostKey,
    learnerSubmitted: Boolean(input.learnerId) && inRound.some((item) => item.learnerId === input.learnerId),
  })
  return {
    visible,
    count: inRound.length,
    responses: visible
      ? inRound.map(({ id, learnerId, text, createdAt }) => ({ id, learnerId, text, createdAt }))
      : [],
  }
}

export const submit = (db: Db, input: SubmitInput, now: Date = new Date(), id: string = crypto.randomUUID()) => {
  const room = requireRoom(db, input.code)
  const text = input.text.trim()
  if (!text) throw new Error('Empty answer')
  if (text.length > MAX_RESPONSE_LENGTH) throw new Error(`Answers are limited to ${MAX_RESPONSE_LENGTH} characters`)
  if (!input.roundId || !input.learnerId) throw new Error('Missing round or learner')

  // The server decides which rounds are live. It does not trust the round the client names.
  let caseId = input.caseId
  if (isOpenRound(input.roundId)) {
    if (!openRoundValid(input.roundId, room.level, now)) throw new Error('This round is no longer open')
  } else {
    if (!ledRoundActive(publicRoom(room), now) || room.roundId !== input.roundId) throw new Error('This round is no longer open')
    if (room.revealed) throw new Error('Answers were already revealed for this round')
    caseId = room.caseId
  }
  if (db.responses.some((item) => item.code === room.code && item.roundId === input.roundId && item.learnerId === input.learnerId)) {
    throw new Error('Already submitted for this round')
  }
  db.responses.push({
    id,
    code: room.code,
    roundId: input.roundId,
    learnerId: input.learnerId,
    caseId,
    level: room.level,
    text,
    createdAt: now.toISOString(),
  })
}

const PATCHABLE: (keyof RoomPatch)[] = ['label', 'level', 'mode', 'caseId', 'roundId', 'roundStartedAt', 'roundSeconds', 'revealed']

export const updateRoom = (db: Db, input: { code: string; hostKey: string; patch: RoomPatch }, now: Date = new Date()) => {
  const room = requireRoom(db, input.code)
  if (room.hostKey !== input.hostKey) throw new Error('Not authorized for this room')
  if (input.patch.level && !LEVELS.includes(input.patch.level)) throw new Error('Unknown level')
  for (const key of PATCHABLE) {
    if (input.patch[key] !== undefined) Object.assign(room, { [key]: input.patch[key] })
  }
  room.updatedAt = now.toISOString()
  return publicRoom(room)
}

export const getHistory = (db: Db, input: { code: string; hostKey: string; since?: string }): SessionResponse[] => {
  const room = requireRoom(db, input.code)
  if (room.hostKey !== input.hostKey) throw new Error('Not authorized for this room')
  return db.responses
    .filter((item) => item.code === room.code && (!input.since || item.createdAt >= input.since))
    .map(({ id, learnerId, text, createdAt, roundId, caseId, level }) => ({ id, learnerId, text, createdAt, roundId, caseId, level }))
}
